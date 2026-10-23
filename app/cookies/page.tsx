import type { Metadata } from "next";
import Link from "next/link";
import { company, lastUpdated } from "@/lib/config";

export const metadata: Metadata = { title: "Cookie Policy", description: "What cookies and browser storage this website uses." };

export default function Cookies() {
  return (
    <section>
      <div className="narrow legal">
        <h1>Cookie Policy</h1>
        <p className="muted">Last updated: {lastUpdated}</p>
        <p>
          Cookies are small files stored by your browser. Similar technologies, such as your browser's local storage, work in the same way.
          This policy explains what {company.name} uses. Our <Link href="/privacy">Privacy Policy</Link> explains how we handle personal information more broadly.
        </p>

        <h2>What we use</h2>
        <table className="cart">
          <thead><tr><th>Name</th><th>Purpose</th><th>Type</th><th>Duration</th></tr></thead>
          <tbody>
            <tr><td><code>go_cart_v1</code> (local storage)</td><td>Remembers the items in your shopping cart</td><td>Strictly necessary</td><td>Until you clear it or check out</td></tr>
            <tr><td><code>go_cookie_notice_v1</code> (local storage)</td><td>Remembers your answer to the cookie notice</td><td>Strictly necessary</td><td>Until you clear it</td></tr>
            <tr><td>PayPal cookies (third party)</td><td>Secure payment, fraud prevention. Loaded <strong>only on the checkout page</strong>.</td><td>Strictly necessary for payment</td><td>Set by PayPal; see <a href="https://www.paypal.com/privacy/cookies" rel="noopener noreferrer">PayPal's cookie policy</a></td></tr>
          </tbody>
        </table>

        <h2>What we do not use</h2>
        <p>We do not currently use advertising, social-media tracking or analytics cookies. Our emails do not use open or click tracking pixels. If we add any in future, we will update this page and ask for your consent first.</p>

        <h2>Your choices</h2>
        <p>
          You can delete or block cookies and site data in your browser settings; the site will still work, but your cart will not be remembered and PayPal checkout may not work.
          To see the cookie notice again, clear this site's data in your browser.
        </p>

        <h2>Contact</h2>
        <p>Questions about this policy: <a href={`mailto:${company.email}`}>{company.email}</a>.</p>
      </div>
    </section>
  );
}
