import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { welcomeEmail } from "@/lib/emails";
import { getIp, rateLimited } from "@/lib/security";
import { sendEmail, unsubscribeUrl } from "@/lib/sparkpost";

export const runtime = "nodejs";

// Confirmation is a POST triggered by a button click on /subscribe/confirm, so mail scanners
// and link prefetchers that merely GET the link cannot confirm someone by accident.
export async function POST(req: Request) {
  const ip = getIp(req);
  if (rateLimited(`confirm:${ip}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, message: "Too many attempts." }, { status: 429 });
  }
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  if (!token || token.length < 32) return NextResponse.json({ ok: false, message: "Invalid link." }, { status: 400 });

  try {
    const rows = await q<{ email: string }>`
      update subscribers
         set status = 'active', confirmed_at = now(), confirmed_ip = ${ip}, confirm_token = null,
             unsubscribed_at = null, soft_bounce_count = 0, updated_at = now()
       where confirm_token = ${token} and status = 'pending' and confirm_sent_at > now() - interval '48 hours'
       returning email`;
    if (!rows[0]) {
      return NextResponse.json({ ok: false, message: "This confirmation link is invalid or has expired. Please sign up again." }, { status: 400 });
    }
    const email = rows[0].email;
    // The person has re-consented, so a prior plain unsubscribe no longer applies.
    await q`delete from suppression where email = ${email} and reason = 'unsubscribe'`;

    const w = welcomeEmail(unsubscribeUrl(email));
    await sendEmail({ to: email, ...w, transactional: true, listUnsubscribe: true }).catch((e) => console.error("welcome email failed", e));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("confirm failed", err);
    return NextResponse.json({ ok: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
