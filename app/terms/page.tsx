import type { Metadata } from "next";
import Link from "next/link";
import { commerce, company, fullAddress, lastUpdated } from "@/lib/config";
import { money } from "@/lib/products";

export const metadata: Metadata = { title: "Terms & Conditions", description: "Terms for using our website and buying our services and products." };

export default function Terms() {
  const shipping = money(commerce.shippingFlatCents, commerce.currency);
  const freeOver = money(commerce.freeShippingOverCents, commerce.currency);
  return (
    <section>
      <div className="narrow legal">
        <h1>Terms &amp; Conditions</h1>
        <p className="muted">Last updated: {lastUpdated}</p>
        <p>
          These terms govern your use of greenoaksrehab.com and your purchases from {company.legalName} ("{company.name}", "we", "us"),
          {" "}{fullAddress}. By using the site or placing an order you agree to them and to our <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2>1. Not medical advice; emergencies</h2>
        <p>
          Website content, product descriptions and emails are general information and are not medical advice or a diagnosis.
          Always follow the advice of your own clinician. If you have a medical emergency, call your local emergency number; do not rely on this site or on email.
        </p>

        <h2>2. Services and appointments</h2>
        <ul>
          <li>Buying a service gives you the right to book that service; our team will contact you to arrange the appointment.</li>
          <li>Please give at least 24 hours' notice to reschedule or cancel an appointment; late changes or missed appointments may use up a session.</li>
          <li>Recovery packages are valid for 6 months from purchase unless the package description says otherwise.</li>
          <li>We may decline or refer you elsewhere if a service is not clinically appropriate for you, in which case we will refund the unused service.</li>
        </ul>

        <h2>3. Orders, prices and payment</h2>
        <p>
          Prices are shown in {commerce.currency} and are the prices at checkout. Payment is taken by PayPal when you place the order; we do not see or store your card details.
          An order is accepted once PayPal confirms payment and we send you a receipt. We may cancel and refund an order if an item is unavailable or a pricing error occurred.
          Applicable taxes, if any, are shown before you pay.
        </p>

        <h2 id="shipping">4. Shipping and returns (physical products)</h2>
        <ul>
          <li>Shipping is a flat {shipping}{commerce.freeShippingOverCents > 0 ? `, free when your product total is ${freeOver} or more` : ""}. Services are not shipped.</li>
          <li>We aim to dispatch orders within 3 business days. Delivery times depend on the carrier and destination.</li>
          <li>You may return unused products in original condition within 30 days of delivery for a refund of the product price. Contact us first at <a href={`mailto:${company.email}`}>{company.email}</a> for return instructions. For safety and hygiene reasons, we cannot accept returns of used items such as compression wear or gel packs, unless faulty.</li>
          <li>If an item arrives damaged or faulty, contact us within 14 days and we will replace or refund it, including return shipping.</li>
          <li>Refunds are made to the original PayPal payment, normally within 5–10 business days.</li>
          <li>Unused services can be refunded within 14 days of purchase; sessions already delivered are not refundable.</li>
        </ul>

        <h2>5. Email communications</h2>
        <p>
          We send marketing email only to people who have signed up and confirmed through double opt-in. Unsubscribe at any time using the link in any email. Order and appointment messages are service messages and are sent regardless.
        </p>

        <h2>6. Using the website</h2>
        <p>
          You agree not to misuse the site, attempt to disrupt it or access it unlawfully, or submit false information. All content, logos and designs are owned by us or our licensors and may not be copied without permission.
        </p>

        <h2>7. Liability</h2>
        <p>
          Nothing in these terms limits liability that cannot lawfully be limited, including for death or personal injury caused by negligence or for fraud.
          Subject to that, we are not liable for indirect or consequential losses, and our total liability for any order is limited to the amount you paid for it.
          The site is provided "as is" and may occasionally be unavailable.
        </p>

        <h2>8. Governing law</h2>
        <p>These terms are governed by the laws of {company.region}, {company.country}, and the courts of that jurisdiction have exclusive jurisdiction, without affecting any mandatory consumer rights you have in your country of residence.</p>

        <h2>9. Changes and contact</h2>
        <p>We may update these terms; the date above shows the latest version. Questions: <a href={`mailto:${company.email}`}>{company.email}</a>, {company.phone}.</p>
      </div>
    </section>
  );
}
