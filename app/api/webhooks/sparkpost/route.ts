import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { safeEqual } from "@/lib/security";
import { addSuppression, logEmailEvent } from "@/lib/suppression";

export const runtime = "nodejs";

// SparkPost bounce classes (https://support.sparkpost.com/docs/deliverability/bounce-classification-codes).
// HARD = address can never receive mail -> suppress immediately.
const HARD = new Set([10, 25, 30, 90]);
// SOFT = temporary or unclear (class 1 "undetermined" included); suppress after repeated failures.
const SOFT = new Set([1, 20, 21, 22, 23, 24, 40, 70]);
const SOFT_LIMIT = 3;

type Ev = Record<string, unknown>;

function authorised(req: Request): boolean {
  const user = process.env.SPARKPOST_WEBHOOK_USER;
  const pass = process.env.SPARKPOST_WEBHOOK_PASS;
  if (!user || !pass) return false; // refuse everything until credentials are configured
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  return safeEqual(header.slice(6), Buffer.from(`${user}:${pass}`).toString("base64"));
}

async function handle(e: Ev) {
  const type = String(e.type || "");
  const email = String(e.rcpt_to || e.raw_rcpt_to || e.email || "").toLowerCase();
  if (!email) return;

  if (type === "bounce" || type === "out_of_band") {
    const cls = Number(e.bounce_class);
    const reason = String(e.reason || e.raw_reason || "").slice(0, 300);
    await logEmailEvent(type, email, `class ${cls}: ${reason}`, e);
    if (HARD.has(cls)) {
      await addSuppression(email, "bounce", `hard bounce class ${cls}: ${reason}`);
    } else if (SOFT.has(cls)) {
      const rows = await q<{ soft_bounce_count: number }>`
        update subscribers set soft_bounce_count = soft_bounce_count + 1, updated_at = now()
         where email = ${email} returning soft_bounce_count`;
      if (rows[0] && rows[0].soft_bounce_count >= SOFT_LIMIT) {
        await addSuppression(email, "bounce", `${SOFT_LIMIT} soft bounces, last class ${cls}: ${reason}`);
      }
    }
  } else if (type === "spam_complaint") {
    await logEmailEvent(type, email, String(e.fbtype || "complaint"), e);
    await addSuppression(email, "complaint", "spam complaint (feedback loop)");
  } else if (type === "list_unsubscribe" || type === "link_unsubscribe") {
    await logEmailEvent(type, email, null, e);
    await addSuppression(email, "unsubscribe", type);
  } else if (type === "policy_rejection") {
    await logEmailEvent(type, email, String(e.reason || ""), e);
  }
}

export async function POST(req: Request) {
  if (!authorised(req)) return new NextResponse("Unauthorized", { status: 401 });

  let batch: unknown;
  try {
    batch = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // SparkPost sends an empty/test ping when the webhook is created
  }
  if (!Array.isArray(batch)) return NextResponse.json({ ok: true });

  for (const item of batch as { msys?: Record<string, Ev> }[]) {
    const event = item?.msys?.message_event || item?.msys?.unsubscribe_event || item?.msys?.relay_event;
    if (!event) continue;
    try {
      await handle(event);
    } catch (err) {
      console.error("webhook event failed", err);
      return new NextResponse("error", { status: 500 }); // SparkPost will retry the batch
    }
  }
  return NextResponse.json({ ok: true });
}
