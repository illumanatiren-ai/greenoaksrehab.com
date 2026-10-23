import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { company } from "@/lib/config";
import { receiptEmail } from "@/lib/emails";
import { paypalCaptureOrder, toValue } from "@/lib/paypal";
import { getIp, rateLimited } from "@/lib/security";
import { sendEmail } from "@/lib/sparkpost";

export const runtime = "nodejs";

type OrderRow = {
  ref: string;
  status: string;
  currency: string;
  total_cents: number;
  items: { lines: { name: string; qty: number; priceCents: number }[]; shippingCents: number };
  needs_shipping: boolean;
};

export async function POST(req: Request) {
  if (rateLimited(`capture:${getIp(req)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const { orderID } = (await req.json().catch(() => ({}))) as { orderID?: string };
  if (!orderID) return NextResponse.json({ error: "Missing order" }, { status: 400 });

  const rows = await q<OrderRow>`select ref, status, currency, total_cents, items, needs_shipping from orders where paypal_order_id = ${orderID}`;
  const order = rows[0];
  if (!order) return NextResponse.json({ error: "Unknown order" }, { status: 404 });
  if (order.status === "paid") return NextResponse.json({ ok: true, ref: order.ref });

  try {
    const result = await paypalCaptureOrder(orderID);
    const unit = result.purchase_units?.[0];
    const capture = unit?.payments?.captures?.[0];

    // Only mark paid when PayPal says COMPLETED and the captured amount equals what WE priced.
    const amountOk = capture && capture.amount.value === toValue(order.total_cents) && capture.amount.currency_code === order.currency;
    if (result.status !== "COMPLETED" || !capture || capture.status !== "COMPLETED" || !amountOk) {
      await q`update orders set status = 'failed' where paypal_order_id = ${orderID} and status = 'created'`;
      return NextResponse.json({ error: "Payment was not completed" }, { status: 402 });
    }

    const payerEmail = result.payer?.email_address || null;
    const payerName = [result.payer?.name?.given_name, result.payer?.name?.surname].filter(Boolean).join(" ") || null;
    await q`
      update orders set status = 'paid', paid_at = now(), payer_email = ${payerEmail}, payer_name = ${payerName},
             shipping = ${JSON.stringify(unit?.shipping ?? null)}::jsonb, paypal_capture_id = ${capture.id}
       where paypal_order_id = ${orderID}`;

    const r = receiptEmail(order.ref, order.items.lines, order.items.shippingCents, order.total_cents, order.currency, order.needs_shipping);
    if (payerEmail) await sendEmail({ to: payerEmail, ...r, transactional: true, replyTo: company.email }).catch((e) => console.error("receipt failed", e));
    // Internal notification so staff can fulfil / schedule.
    await sendEmail({
      to: company.email,
      subject: `New paid order ${order.ref}`,
      html: r.html,
      text: r.text + `\nPayer: ${payerName ?? ""} <${payerEmail ?? ""}>`,
      transactional: true,
    }).catch((e) => console.error("staff notify failed", e));

    return NextResponse.json({ ok: true, ref: order.ref });
  } catch (err) {
    console.error("capture failed", err);
    return NextResponse.json({ error: "Could not capture payment" }, { status: 500 });
  }
}
