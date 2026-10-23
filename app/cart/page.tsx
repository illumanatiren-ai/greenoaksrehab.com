import type { Metadata } from "next";
import CartView from "@/components/CartView";
import { commerce } from "@/lib/config";
import { products } from "@/lib/products";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default function Cart() {
  return (
    <section>
      <div className="wrap">
        <h1>Your cart</h1>
        <CartView products={products} currency={commerce.currency} flatCents={commerce.shippingFlatCents} freeOverCents={commerce.freeShippingOverCents} />
      </div>
    </section>
  );
}
