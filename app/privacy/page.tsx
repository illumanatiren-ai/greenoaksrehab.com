import type { Metadata } from "next";
import Link from "next/link";
import { company, fullAddress, lastUpdated } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy Policy", description: "How we collect, use and protect your personal information." };

export default function Privacy() {
  return (
    <section>
      <div className="narrow legal">
        <h1>Privacy Policy</h1>
        <p className="muted">Last updated: {lastUpdated}</p>
        <p>
          This policy explains how {company.legalName} ("{company.name}", "we", "us") handles personal information collected through
          greenoaksrehab.com. We are located at {fullAddress}. You can reach us at <a href={`mailto:${company.email}`}>{company.email}</a> or {company.phone}.
        </p>

        <h2>1. Information we collect</h2>
        <ul>
          <li><strong>Contact form:</strong> your name, email address, optional phone number, your message and your IP address.</li>
          <li><strong>Orders:</strong> what you bought, and the name, email address and shipping address (for physical items) provided by PayPal. Payment is handled by PayPal; we never receive or store your card number.</li>
          <li><strong>Email signup:</strong> your email address and a record of your consent: the wording you agreed to, the date and time, your IP address and browser details, and the date you confirmed. We keep this record so we can prove consent.</li>
          <li><strong>Technical data:</strong> standard server logs (IP address, pages requested, browser type) used to keep the site secure and working.</li>
          <li><strong>Cookies and browser storage:</strong> see our <Link href="/cookies">Cookie Policy</Link>.</li>
        </ul>

        <h2>2. How we use it, and why</h2>
        <ul>
          <li>To provide the services and products you order, take payment, send receipts and schedule appointments (performance of a contract).</li>
          <li>To answer your enquiries (our legitimate interest in running the business).</li>
          <li>To send newsletters and offers, <strong>only if you have signed up and confirmed</strong> through our double opt-in process (your consent).</li>
          <li>To keep the site secure, prevent fraud and meet legal obligations.</li>
        </ul>

        <h2>3. Email marketing, consent and unsubscribing</h2>
        <p>
          When you sign up we send one email asking you to confirm your address. You are not subscribed until you click the confirmation button.
          Every marketing email contains a one-click unsubscribe link, and supporting email programs show an "Unsubscribe" button using the
          standard List-Unsubscribe header. After you unsubscribe, we keep your email address on a <em>suppression list</em> solely so that we never email you again by mistake.
          Addresses that bounce or that report our email as spam are also added to this list. You can withdraw consent at any time without giving a reason.
        </p>

        <h2>4. Who we share information with</h2>
        <p>We do not sell your personal information. We share it only with providers that help us run the site, under appropriate terms:</p>
        <ul>
          <li><strong>PayPal</strong>: payment processing.</li>
          <li><strong>SparkPost (Bird)</strong>: sending our email.</li>
          <li><strong>Vercel</strong>: website hosting.</li>
          <li><strong>Neon</strong>: database hosting.</li>
          <li>Professional advisers, and authorities where the law requires.</li>
        </ul>
        <p>Some of these providers process data in the United States or other countries; where required we rely on appropriate safeguards for international transfers.</p>

        <h2>5. How long we keep it</h2>
        <ul>
          <li>Order records: as long as needed for accounting and tax law (typically up to 7 years).</li>
          <li>Contact messages: up to 24 months.</li>
          <li>Newsletter data: until you unsubscribe; consent proof and the suppression entry are kept afterwards so your choice is respected.</li>
        </ul>

        <h2>6. Your rights</h2>
        <p>
          Depending on where you live, you may have the right to access, correct, delete or export your personal information, to object to or restrict certain uses,
          to withdraw consent, and to complain to your data protection authority. Email <a href={`mailto:${company.email}`}>{company.email}</a> and we will respond within the time required by law.
          California residents: we do not sell or share personal information for cross-context advertising.
        </p>

        <h2>7. Health information</h2>
        <p>
          This website is not designed to collect health records. Please do not include detailed medical information in the contact form or emails.
          Information you give us in the course of receiving care is handled under the privacy notices and consents that apply to our clinical services.
        </p>

        <h2>8. Security</h2>
        <p>The site uses HTTPS encryption, access-controlled databases and signed, expiring links. No system is perfectly secure, but we take reasonable measures to protect your data.</p>

        <h2>9. Children</h2>
        <p>Our site is intended for adults. We do not knowingly collect personal information from children under 16 without a parent's or guardian's involvement.</p>

        <h2>10. Changes</h2>
        <p>We may update this policy and will change the date above when we do. Material changes will be highlighted on this page.</p>

        <h2>11. Contact</h2>
        <p>{company.legalName}, {fullAddress}. Email <a href={`mailto:${company.email}`}>{company.email}</a>. Phone {company.phone}.</p>
      </div>
    </section>
  );
}
