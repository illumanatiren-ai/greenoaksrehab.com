import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Services",
  description: "Physical therapy evaluations, follow-up sessions, recovery packages and telehealth consults.",
};

export default function Services() {
  return (
    <section>
      <div className="wrap">
        <h1>Services</h1>
        <p className="muted" style={{ maxWidth: 680 }}>
          Choose a service and pay online. After your order, our team contacts you to schedule your appointment at a time that suits you.
        </p>
        <div className="grid">{products.filter((p) => p.kind === "service").map((p) => <ProductCard key={p.id} p={p} />)}</div>
        <div className="notice" style={{ marginTop: 28 }}>
          Our services support recovery and are not a substitute for emergency care. If you think you are having a medical emergency, call your local emergency number.
          See our <Link href="/terms">Terms</Link> for scheduling and cancellation details.
        </div>
      </div>
    </section>
  );
}
