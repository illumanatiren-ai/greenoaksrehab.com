import Link from "next/link";
import SubscribeForm from "./SubscribeForm";
import { company, fullAddress } from "@/lib/config";
import { consentText } from "@/lib/emails";

export default function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="cols">
          <div>
            <h3>{company.name}</h3>
            <address style={{ fontStyle: "normal" }}>
              {company.addressLine1}
              <br />
              {company.addressLine2 && (
                <>
                  {company.addressLine2}
                  <br />
                </>
              )}
              {company.city}, {company.region} {company.postal}
              <br />
              {company.country}
            </address>
            <p>
              Phone: <a href={company.phoneE164 ? `tel:${company.phoneE164}` : undefined}>{company.phone}</a>
              <br />
              Email: <a href={`mailto:${company.email}`}>{company.email}</a>
              {company.hours && (
                <>
                  <br />
                  Hours: {company.hours}
                </>
              )}
            </p>
          </div>
          <div>
            <h3>Explore</h3>
            <ul>
              <li><Link href="/services">Services</Link></li>
              <li><Link href="/shop">Shop</Link></li>
              <li><Link href="/about">About us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/cart">Cart</Link></li>
            </ul>
            <h3 style={{ marginTop: 18 }}>Legal</h3>
            <ul>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms &amp; Conditions</Link></li>
              <li><Link href="/cookies">Cookie Policy</Link></li>
            </ul>
          </div>
          <div className="footer-form">
            <h3>Recovery tips by email</h3>
            <SubscribeForm consent={consentText()} source="footer" idPrefix="ft" />
          </div>
        </div>
        <div className="legalline">
          &copy; {new Date().getFullYear()} {company.legalName}. {fullAddress}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
