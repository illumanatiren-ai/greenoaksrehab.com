import type { Metadata } from "next";
import CheckoutClient from "@/components/CheckoutClient";
import { commerce } from "@/lib/config";
import { products } from "@/lib/products";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function Checkout() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
  // Demo checkout (no real payment): on when NEXT_PUBLIC_DEMO_CHECKOUT=1, or when no real PayPal client ID is set.
  const demo = process.env.NEXT_PUBLIC_DEMO_CHECKOUT === "1" || !clientId || clientId.toLowerCase().startsWith("dummy");
  return (
    <section>
      <div className="wrap">
        <h1>Checkout</h1>
        {clientId || demo ? (
          <CheckoutClient
            products={products}
            currency={commerce.currency}
            flatCents={commerce.shippingFlatCents}
            freeOverCents={commerce.freeShippingOverCents}
            clientId={clientId}
            demo={demo}
          />
        ) : (
          <div className="msg err">Online payment is not configured yet (missing PayPal client ID).</div>
        )}
      </div>
    </section>
  );
}
