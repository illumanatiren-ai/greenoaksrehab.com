import Link from "next/link";
import CartLink from "./CartLink";
import { company } from "@/lib/config";

export default function Header() {
  return (
    <header className="site">
      <div className="wrap">
        <Link href="/" className="logo">
          <span className="leaf" aria-hidden="true" />
          {company.name}
        </Link>
        <nav className="main" aria-label="Main">
          <Link href="/services">Services</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <CartLink />
        </nav>
      </div>
    </header>
  );
}
