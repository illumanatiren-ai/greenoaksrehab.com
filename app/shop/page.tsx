import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { commerce } from "@/lib/config";
import { money, products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop recovery gear",
  description: "Resistance bands, foam rollers, hot & cold packs and supports for home rehabilitation routines.",
};

export default function Shop() {
  return (
    <section>
      <div className="wrap">
        <h1>Recovery gear</h1>
        <p className="muted" style={{ maxWidth: 680 }}>
          Simple, durable tools for your home routine. Flat-rate shipping of {money(commerce.shippingFlatCents, commerce.currency)}
          {commerce.freeShippingOverCents > 0 ? `, free on product orders of ${money(commerce.freeShippingOverCents, commerce.currency)} or more` : ""}.
          See <Link href="/terms#shipping">shipping &amp; returns</Link>.
        </p>
        <div className="grid">{products.filter((p) => p.kind === "product").map((p) => <ProductCard key={p.id} p={p} />)}</div>
        <p className="notice" style={{ marginTop: 28 }}>
          Product information is general and is not medical advice. Ask your clinician which equipment is right for you.
        </p>
      </div>
    </section>
  );
}
