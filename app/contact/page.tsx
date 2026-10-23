import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { company } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact",
  description: "Call, email or write to us. Find our address and phone number.",
};

export default function Contact() {
  return (
    <section>
      <div className="wrap">
        <h1>Contact us</h1>
        <div className="two">
          <div>
            <h2>Our details</h2>
            <address style={{ fontStyle: "normal" }}>
              <strong>{company.legalName}</strong><br />
              {company.addressLine1}<br />
              {company.addressLine2 && (<>{company.addressLine2}<br /></>)}
              {company.city}, {company.region} {company.postal}<br />
              {company.country}
            </address>
            <p>
              Phone: <a href={company.phoneE164 ? `tel:${company.phoneE164}` : undefined}>{company.phone}</a><br />
              Email: <a href={`mailto:${company.email}`}>{company.email}</a>
              {company.hours && (<><br />Hours: {company.hours}</>)}
            </p>
            <p className="notice">In a medical emergency, call your local emergency number. Do not use this form for urgent matters.</p>
          </div>
          <div>
            <h2>Send a message</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
