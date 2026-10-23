"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { totals } from "./cartMath";
import { money, type Product } from "@/lib/products";

type Props = { products: Product[]; currency: string; flatCents: number; freeOverCents: number };

export default function CartView({ products, currency, flatCents, freeOverCents }: Props) {
  const { items, setQty, remove, ready } = useCart();
  const lines = items.flatMap((i) => {
    const product = products.find((p) => p.id === i.id);
    return product ? [{ product, qty: i.qty }] : [];
  });

  if (!ready) return <p className="muted">Loading your cart…</p>;
  if (lines.length === 0) {
    return (
      <div>
        <p>Your cart is empty.</p>
        <p>
          <Link className="btn" href="/services">Browse services</Link>{" "}
          <Link className="btn ghost" href="/shop">Shop recovery gear</Link>
        </p>
      </div>
    );
  }
  const t = totals(lines, flatCents, freeOverCents);
  return (
    <div>
      <table className="cart">
        <thead>
          <tr><th>Item</th><th>Quantity</th><th className="num">Price</th><th className="num"><span className="sr">Remove</span></th></tr>
        </thead>
        <tbody>
          {lines.map(({ product, qty }) => (
            <tr key={product.id}>
              <td>
                <strong>{product.name}</strong>
                <div className="muted" style={{ fontSize: ".88rem" }}>{product.kind === "service" ? "Service" : "Ships to you"}</div>
              </td>
              <td>
                <span className="qty">
                  <button aria-label={`Decrease quantity of ${product.name}`} onClick={() => setQty(product.id, qty - 1)}>−</button>
                  <span aria-live="polite">{qty}</span>
                  <button aria-label={`Increase quantity of ${product.name}`} onClick={() => setQty(product.id, qty + 1)}>+</button>
                </span>
              </td>
              <td className="num">{money(product.priceCents * qty, currency)}</td>
              <td className="num"><button className="btn ghost small" onClick={() => remove(product.id)} aria-label={`Remove ${product.name}`}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="totals">
        <div><span>Subtotal</span><span>{money(t.subtotal, currency)}</span></div>
        <div><span>Shipping</span><span>{t.needsShipping ? (t.shipping ? money(t.shipping, currency) : "Free") : "Not needed"}</span></div>
        <div className="grand"><span>Total</span><span>{money(t.total, currency)}</span></div>
        <p className="muted" style={{ fontSize: ".85rem" }}>
          {t.needsShipping && freeOverCents > 0 ? `Free shipping on product orders of ${money(freeOverCents, currency)} or more. ` : ""}
          Taxes, if applicable, are shown by PayPal before you pay.
        </p>
        <Link className="btn" href="/checkout" style={{ width: "100%", textAlign: "center" }}>Proceed to checkout</Link>
      </div>
    </div>
  );
}
