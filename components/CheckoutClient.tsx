"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useCart } from "./CartProvider";
import { totals } from "./cartMath";
import { money, type Product } from "@/lib/products";

type Props = { products: Product[]; currency: string; flatCents: number; freeOverCents: number; clientId: string };

export default function CheckoutClient({ products, currency, flatCents, freeOverCents, clientId }: Props) {
  const router = useRouter();
  const { items, clear, ready } = useCart();
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");

  const lines = items.flatMap((i) => {
    const product = products.find((p) => p.id === i.id);
    return product ? [{ product, qty: i.qty }] : [];
  });

  if (!ready) return <p className="muted">Loading…</p>;
  if (lines.length === 0) {
    return (
      <p>
        Your cart is empty. <Link href="/shop">Continue shopping</Link>
      </p>
    );
  }
  const t = totals(lines, flatCents, freeOverCents);

  return (
    <div className="two">
      <div>
        <h2>Order summary</h2>
        <table className="cart">
          <tbody>
            {lines.map(({ product, qty }) => (
              <tr key={product.id}>
                <td>{product.name} × {qty}</td>
                <td className="num">{money(product.priceCents * qty, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="totals" style={{ marginLeft: 0 }}>
          <div><span>Subtotal</span><span>{money(t.subtotal, currency)}</span></div>
          <div><span>Shipping</span><span>{t.needsShipping ? (t.shipping ? money(t.shipping, currency) : "Free") : "Not needed"}</span></div>
          <div className="grand"><span>Total</span><span>{money(t.total, currency)}</span></div>
        </div>
        <p><Link href="/cart">← Edit cart</Link></p>
      </div>

      <div>
        <h2>Pay securely</h2>
        <p className="muted">
          Payment is processed by PayPal. You can pay with your PayPal balance or a debit/credit card. We never see or store your card details.
          {t.needsShipping ? " PayPal will ask for your shipping address." : ""}
        </p>
        <label className="check" htmlFor="agree-terms">
          <input id="agree-terms" type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>
            I have read and agree to the <Link href="/terms" target="_blank">Terms &amp; Conditions</Link> and{" "}
            <Link href="/privacy" target="_blank">Privacy Policy</Link>.
          </span>
        </label>

        <PayPalScriptProvider options={{ clientId, currency, intent: "capture" }}>
          <PayPalButtons
            style={{ layout: "vertical", shape: "rect" }}
            disabled={!agree}
            forceReRender={[agree, items, currency]}
            createOrder={async () => {
              setError("");
              const res = await fetch("/api/paypal/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: items.map((i) => ({ id: i.id, qty: i.qty })) }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok || !data.id) {
                setError("We could not start your checkout. Please try again, or contact us.");
                throw new Error("create-order failed");
              }
              return data.id as string;
            }}
            onApprove={async (data) => {
              const res = await fetch("/api/paypal/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderID: data.orderID }),
              });
              const out = await res.json().catch(() => ({}));
              if (res.ok && out.ok) {
                clear();
                router.push(`/order-complete?ref=${encodeURIComponent(out.ref)}`);
              } else {
                setError(out.error || "Your payment could not be completed. You have not been charged unless PayPal tells you otherwise.");
              }
            }}
            onError={() => setError((e) => e || "PayPal reported a problem. Please try again.")}
          />
        </PayPalScriptProvider>
        {!agree && <p className="muted" style={{ fontSize: ".88rem" }}>Tick the box above to enable the payment buttons.</p>}
        <div role="alert">{error && <div className="msg err">{error}</div>}</div>
      </div>
    </div>
  );
}
