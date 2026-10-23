import { mail, siteUrl } from "./config";
import { isBlocked } from "./suppression";
import { signEmail } from "./security";

export type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Transactional = confirmation, welcome, receipts, contact replies. Marketing = newsletters. */
  transactional: boolean;
  replyTo?: string;
  /** Adds RFC 8058 one-click List-Unsubscribe headers (use for every marketing/newsletter message). */
  listUnsubscribe?: boolean;
};

export type SendResult = { sent: boolean; skipped?: "suppressed"; id?: string };

export const unsubscribeUrl = (email: string) => `${siteUrl}/unsubscribe?t=${encodeURIComponent(signEmail(email))}`;

export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const to = args.to.toLowerCase();

  // Suppression database is checked before EVERY send.
  if (await isBlocked(to, args.transactional)) return { sent: false, skipped: "suppressed" };

  const key = process.env.SPARKPOST_API_KEY;
  if (!key) throw new Error("SPARKPOST_API_KEY is not set");

  const headers: Record<string, string> = {};
  if (args.listUnsubscribe) {
    const url = `${siteUrl}/api/unsubscribe?t=${encodeURIComponent(signEmail(to))}`;
    // HTTPS one-click only (RFC 8058). A mailto: entry is omitted on purpose: nothing processes
    // inbound unsubscribe mail here, so advertising one would silently fail for the subscriber.
    headers["List-Unsubscribe"] = `<${url}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const body: Record<string, unknown> = {
    options: { transactional: args.transactional, open_tracking: false, click_tracking: false },
    content: {
      from: { email: mail.fromEmail, name: mail.fromName },
      subject: args.subject,
      html: args.html,
      text: args.text,
      ...(args.replyTo ? { reply_to: args.replyTo } : {}),
      ...(Object.keys(headers).length ? { headers } : {}),
    },
    recipients: [{ address: { email: to } }],
  };
  if (mail.returnPath) body.return_path = mail.returnPath;

  const res = await fetch(`${mail.apiUrl}/api/v1/transmissions`, {
    method: "POST",
    headers: { Authorization: key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`SparkPost error ${res.status}: ${(await res.text()).slice(0, 500)}`);
  }
  const data = (await res.json()) as { results?: { id?: string } };
  return { sent: true, id: data.results?.id };
}
