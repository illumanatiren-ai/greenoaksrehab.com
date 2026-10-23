import type { Metadata } from "next";
import Link from "next/link";
import { company } from "@/lib/config";

export const metadata: Metadata = { title: "Order complete", robots: { index: false } };

export default async function OrderComplete({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const safeRef = (ref || "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 20);
  return (
    <section>
      <div className="narrow">
        <h1>Thank you for your order</h1>
        {safeRef && <p>Your order reference is <strong>{safeRef}</strong>.</p>}
        <p>A receipt is on its way to your PayPal email address. For therapy services and packages, our team will contact you to schedule your appointment. Physical items ship to the address on your PayPal order.</p>
        <p>Questions? Call <strong>{company.phone}</strong> or email <a href={`mailto:${company.email}`}>{company.email}</a>, quoting your reference.</p>
        <p><Link className="btn" href="/">Back to home</Link></p>
      </div>
    </section>
  );
}
