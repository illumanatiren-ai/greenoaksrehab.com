import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { company } from "@/lib/config";
import { escapeHtml, getIp, isEmail, rateLimited } from "@/lib/security";
import { sendEmail } from "@/lib/sparkpost";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = getIp(req);
  if (rateLimited(`contact:${ip}`, 4, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, message: "Too many messages. Please try again later." }, { status: 429 });
  }
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  if (b.website) return NextResponse.json({ ok: true }); // honeypot

  const name = (b.name || "").trim().slice(0, 120);
  const email = (b.email || "").trim().toLowerCase();
  const phone = (b.phone || "").trim().slice(0, 40);
  const message = (b.message || "").trim().slice(0, 4000);
  if (!name || !isEmail(email) || message.length < 5) {
    return NextResponse.json({ ok: false, message: "Please fill in your name, a valid email and a message." }, { status: 400 });
  }

  try {
    await q`insert into contact_messages (name, email, phone, message, ip) values (${name}, ${email}, ${phone || null}, ${message}, ${ip})`;
    // Notify the business. Reply-To is the visitor so staff can answer directly.
    await sendEmail({
      to: company.email,
      subject: `Website enquiry from ${name}`,
      html: `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt; ${escapeHtml(phone)}</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
      text: `${name} <${email}> ${phone}\n\n${message}`,
      transactional: true,
      replyTo: email,
    }).catch((e) => console.error("contact notify failed", e));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("contact failed", err);
    return NextResponse.json({ ok: false, message: "Something went wrong. Please call us instead." }, { status: 500 });
  }
}
