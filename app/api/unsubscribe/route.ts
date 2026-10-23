import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/security";
import { addSuppression, logEmailEvent } from "@/lib/suppression";

export const runtime = "nodejs";

// POST only. Handles both the one-click header (RFC 8058, mail clients POST here with
// "List-Unsubscribe=One-Click") and the /unsubscribe page, which POSTs automatically on load.
// Deliberately NOT a GET so link scanners cannot unsubscribe people by prefetching.
export async function POST(req: Request) {
  const url = new URL(req.url);
  let token = url.searchParams.get("t") || "";
  if (!token) {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) token = ((await req.json().catch(() => ({}))) as { t?: string }).t || "";
  }
  const email = verifyEmailToken(token);
  if (!email) return NextResponse.json({ ok: false, message: "Invalid unsubscribe link." }, { status: 400 });

  try {
    await addSuppression(email, "unsubscribe", "user unsubscribed via link");
    await logEmailEvent("unsubscribe", email, "one-click / link", {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("unsubscribe failed", err);
    return NextResponse.json({ ok: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
