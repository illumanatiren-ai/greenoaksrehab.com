import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { commerce, company } from "@/lib/config";
import { paypalCreateOrder, toValue } from "@/lib/paypal";
import { priceCart } from "@/lib/pricing";
import { getIp, rateLimited } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (rateLimited(`order:${getIp(req)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const { items } = (await req.json().catch(() => ({}))) as { items?: unknown };
  const priced = priceCart(items);
  if (!priced) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });

  const cur = commerce.currency;
  const ref = "GO-" + crypto.randomBytes(4).toString("hex").toUpperCase();

  try {
    const order = await paypalCreateOrder({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: ref,
          custom_id: ref,
          description: `${company.name} order ${ref}`.slice(0, 127),
          amount: {
            currency_code: cur,
            value: toValue(priced.totalCents),
            breakdown: {
              item_total: { currency_code: cur, value: toValue(priced.subtotalCents) },
              shipping: { currency_code: cur, value: toValue(priced.shippingCents) },
            },
          },
          items: priced.lines.map((l) => ({
            name: l.product.name.slice(0, 127),
            sku: l.product.id,
            unit_amount: { currency_code: cur, value: toValue(l.product.priceCents) },
            quantity: String(l.qty),
            category: l.product.physical ? "PHYSICAL_GOODS" : "DIGITAL_GOODS",
          })),
        },
      ],
      application_context: {
        brand_name: company.name,
        user_action: "PAY_NOW",
        shipping_preference: priced.needsShipping ? "GET_FROM_FILE" : "NO_SHIPPING",
      },
    });

    const snapshot = priced.lines.map((l) => ({ id: l.product.id, name: l.product.name, qty: l.qty, priceCents: l.product.priceCents }));
    await q`
      insert into orders (ref, paypal_order_id, currency, total_cents, items, needs_shipping)
      values (${ref}, ${order.id}, ${cur}, ${priced.totalCents}, ${JSON.stringify({ lines: snapshot, shippingCents: priced.shippingCents })}::jsonb, ${priced.needsShipping})`;

    return NextResponse.json({ id: order.id });
  } catch (err) {
    console.error("create-order failed", err);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
