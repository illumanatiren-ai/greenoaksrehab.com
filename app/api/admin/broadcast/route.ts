import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { newsletterWrap } from "@/lib/emails";
import { safeEqual } from "@/lib/security";
import { sendEmail, unsubscribeUrl } from "@/lib/sparkpost";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Send a newsletter to every confirmed subscriber that is NOT in the suppression table.
 *   curl -X POST https://greenoaksrehab.com/api/admin/broadcast \
 *     -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
 *     -d '{"subject":"October tips","html":"<p>Hello!</p>","text":"Hello!"}'
 * Add "dryRun": true to see the recipient count without sending.
 * Fine for lists up to a few thousand; for larger lists move this to a queue/cron.
 */
export async function POST(req: Request) {
  const token = process.env.ADMIN_TOKEN || "";
  const given = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  if (!token || token.length < 16 || !safeEqual(given, token)) return new NextResponse("Unauthorized", { status: 401 });

  const { subject, html, text, dryRun } = (await req.json().catch(() => ({}))) as {
    subject?: string;
    html?: string;
    text?: string;
    dryRun?: boolean;
  };
  if (!subject || !html) return NextResponse.json({ error: "subject and html are required" }, { status: 400 });

  const recipients = await q<{ email: string }>`
    select s.email from subscribers s
     where s.status = 'active'
       and not exists (select 1 from suppression x where x.email = s.email)
     order by s.id`;

  if (dryRun) return NextResponse.json({ recipients: recipients.length });

  let sent = 0;
  let failed = 0;
  for (let i = 0; i < recipients.length; i += 10) {
    const chunk = recipients.slice(i, i + 10);
    await Promise.all(
      chunk.map(async ({ email }) => {
        try {
          const unsub = unsubscribeUrl(email);
          const w = newsletterWrap(html, text || html.replace(/<[^>]+>/g, ""), unsub);
          const r = await sendEmail({ to: email, subject, ...w, transactional: false, listUnsubscribe: true });
          if (r.sent) sent++;
        } catch (e) {
          failed++;
          console.error("broadcast failure", email, e);
        }
      })
    );
  }
  return NextResponse.json({ recipients: recipients.length, sent, failed });
}
