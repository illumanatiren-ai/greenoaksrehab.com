import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import SubscribeForm from "@/components/SubscribeForm";
import { company, siteUrl } from "@/lib/config";
import { consentText } from "@/lib/emails";
import { products } from "@/lib/products";

export default function Home() {
  const services = products.filter((p) => p.kind === "service").slice(0, 3);
  const gear = products.filter((p) => p.kind === "product").slice(0, 3);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Physiotherapy",
    name: company.name,
    url: siteUrl,
    telephone: company.phone,
    email: company.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.addressLine1,
      addressLocality: company.city,
      addressRegion: company.region,
      postalCode: company.postal,
      addressCountry: company.country,
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="hero">
        <div className="wrap">
          <h1>Move better.<br />Recover with confidence.</h1>
          <p className="lead">
            Personalized physical therapy and injury rehabilitation, flexible recovery packages, telehealth consults and the gear to
            keep your progress going at home.
          </p>
          <div className="actions">
            <Link className="btn" href="/services">Book a service</Link>
            <Link className="btn ghost" href="/shop">Shop recovery gear</Link>
          </div>
        </div>
      </div>

      <section>
        <div className="wrap">
          <h2>How we help you recover</h2>
          <div className="grid">
            <div className="card"><h3>Assess</h3><p className="muted">A one-on-one evaluation of your movement, your injury and what you want to get back to.</p></div>
            <div className="card"><h3>Treat</h3><p className="muted">Hands-on sessions and guided exercise, progressed step by step as you get stronger.</p></div>
            <div className="card"><h3>Sustain</h3><p className="muted">Telehealth check-ins and home recovery gear so progress doesn't stop when the session ends.</p></div>
          </div>
        </div>
      </section>

      <section className="alt">
        <div className="wrap">
          <h2>Popular services</h2>
          <div className="grid">{services.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          <p><Link href="/services">See all services →</Link></p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <h2>How booking works</h2>
          <div className="grid">
            <div className="card"><h3>1. Choose</h3><p className="muted">Add a service or recovery gear to your cart.</p></div>
            <div className="card"><h3>2. Pay securely</h3><p className="muted">Check out with PayPal. We never see your card details.</p></div>
            <div className="card"><h3>3. We schedule you</h3><p className="muted">For services, our team contacts you to arrange your appointment. Gear ships to your door.</p></div>
          </div>
        </div>
      </section>

      <section className="alt">
        <div className="wrap">
          <h2>Recovery gear for home</h2>
          <div className="grid">{gear.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          <p><Link href="/shop">Shop all gear →</Link></p>
        </div>
      </section>

      <section className="sage">
        <div className="narrow">
          <h2>Get recovery tips by email</h2>
          <p>Occasional exercises, news and offers. You will get a confirmation email first, and you can unsubscribe in one click at any time.</p>
          <SubscribeForm consent={consentText()} source="home" idPrefix="hm" />
        </div>
      </section>
    </>
  );
}
