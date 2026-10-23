import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { siteUrl } from "@/lib/config";
import { consentText, confirmEmail } from "@/lib/emails";
import { getIp, isEmail, randomToken, rateLimited } from "@/lib/security";
import { sendEmail } from "@/lib/sparkpost";
import { getSuppression } from "@/lib/suppression";

export const runtime = "nodejs";

// Same reply for every outcome so the form cannot be used to discover who is subscribed.
const OK = { ok: true, message: "Almost done! Check your inbox for a confirmation email and click the link to finish subscribing." };

export async function POST(req: Request) {
  const ip = getIp(req);
  if (rateLimited(`sub:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, message: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let body: { email?: string; consent?: boolean; website?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  if (body.website) return NextResponse.json(OK); // honeypot: pretend success to bots

  const email = (body.email || "").trim().toLowerCase();
  if (!isEmail(email)) return NextResponse.json({ ok: false, message: "Please enter a valid email address." }, { status: 400 });
  if (body.consent !== true) {
    return NextResponse.json({ ok: false, message: "Please tick the box to agree to receive emails." }, { status: 400 });
  }

  try {
    const reason = await getSuppression(email);
    if (reason && reason !== "unsubscribe") return NextResponse.json(OK); // bounced/complained/manual: never email again

    const existing = await q<{ status: string }>`select status from subscribers where email = ${email}`;
    if (existing[0]?.status === "active") return NextResponse.json(OK); // already confirmed, do nothing

    const token = randomToken();
    const ua = (req.headers.get("user-agent") || "").slice(0, 300);
    await q`
      insert into subscribers (email, status, source, consent_text, consent_at, consent_ip, consent_user_agent, confirm_token, confirm_sent_at)
      values (${email}, 'pending', ${(body.source || "website").slice(0, 60)}, ${consentText()}, now(), ${ip}, ${ua}, ${token}, now())
      on conflict (email) do update set
        status = 'pending', consent_text = excluded.consent_text, consent_at = now(), consent_ip = excluded.consent_ip,
        consent_user_agent = excluded.consent_user_agent, confirm_token = excluded.confirm_token,
        confirm_sent_at = now(), updated_at = now()`;

    const mailContent = confirmEmail(`${siteUrl}/subscribe/confirm?token=${token}`);
    await sendEmail({ to: email, ...mailContent, transactional: true });
    return NextResponse.json(OK);
  } catch (err) {
    console.error("subscribe failed", err);
    return NextResponse.json({ ok: false, message: "Something went wrong. Please try again shortly." }, { status: 500 });
  }
}
