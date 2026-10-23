import type { Metadata } from "next";
import Link from "next/link";
import { company, fullAddress } from "@/lib/config";

export const metadata: Metadata = {
  title: "About us",
  description: "Who we are and how we approach physical therapy and injury recovery.",
};

export default function About() {
  return (
    <>
      <section>
        <div className="narrow">
          <h1>About {company.name}</h1>
          <p className="lead muted" style={{ fontSize: "1.15rem" }}>
            We help people recover from injury, surgery and long-standing pain, and get back to the movement they enjoy.
          </p>
          <p>
            {company.name} is operated by {company.legalName}. We combine one-on-one physical therapy with clear plans, home exercise
            support and practical recovery gear, so that progress continues between appointments.
          </p>
          <h2>Our approach</h2>
          <div className="grid">
            <div className="card"><h3>Personal</h3><p className="muted">Every plan starts with your history, your goals and your life, not a generic protocol.</p></div>
            <div className="card"><h3>Clear</h3><p className="muted">You will always know what we are doing, why, and what comes next.</p></div>
            <div className="card"><h3>Practical</h3><p className="muted">Simple exercises and equipment you can actually use at home.</p></div>
          </div>
        </div>
      </section>
      <section className="alt">
        <div className="narrow">
          <h2>Visit or contact us</h2>
          <address style={{ fontStyle: "normal" }}>
            <strong>{company.legalName}</strong><br />
            {fullAddress}<br />
            Phone: <a href={company.phoneE164 ? `tel:${company.phoneE164}` : undefined}>{company.phone}</a><br />
            Email: <a href={`mailto:${company.email}`}>{company.email}</a>
            {company.hours && (<><br />Hours: {company.hours}</>)}
          </address>
          <p><Link className="btn" href="/contact">Send us a message</Link></p>
        </div>
      </section>
    </>
  );
}
