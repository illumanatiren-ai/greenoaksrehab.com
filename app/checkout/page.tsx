import type { Metadata } from "next";
import CheckoutClient from "@/components/CheckoutClient";
import { commerce } from "@/lib/config";
import { products } from "@/lib/products";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function Checkout() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
  return (
    <section>
      <div className="wrap">
        <h1>Checkout</h1>
        {clientId ? (
          <CheckoutClient
            products={products}
            currency={commerce.currency}
            flatCents={commerce.shippingFlatCents}
            freeOverCents={commerce.freeShippingOverCents}
            clientId={clientId}
          />
        ) : (
          <div className="msg err">Online payment is not configured yet (missing PayPal client ID).</div>
        )}
      </div>
    </section>
  );
}
