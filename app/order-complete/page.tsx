import type { Metadata } from "next";
import Link from "next/link";
import { company } from "@/lib/config";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

export default async function OrderComplete({ searchParams }: { searchParams: Promise<{ ref?: string; demo?: string }> }) {
  const { ref, demo } = await searchParams;
  const safeRef = (ref || "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 20);
  const isDemo = demo === "1";
  return (
    <section>
      <div className="narrow confirm">
        <svg className="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M7.5 12.5l3 3 6-6.5" />
        </svg>
        <h1>Order confirmed</h1>
        <p>Thank you for choosing Green Oaks Rehab.{safeRef && <> Your order number is <strong className="ref">{safeRef}</strong>.</>}</p>
        {isDemo ? (
          <p className="muted">This was a demonstration checkout. No payment was taken and no confirmation email was sent.</p>
        ) : (
          <p>A receipt is on its way to your PayPal email address. For therapy services and packages, our team will contact you to schedule your appointment. Physical items ship to the address on your PayPal order.</p>
        )}
        <p>Questions? Call <strong>{company.phone}</strong> or email <a href={`mailto:${company.email}`}>{company.email}</a>{safeRef ? ", quoting your order number" : ""}.</p>
        <div className="actions">
          <Link className="btn" href="/shop">Continue shopping</Link>
          <Link className="btn ghost" href="/">Back to home</Link>
        </div>
      </div>
    </section>
  );
}
