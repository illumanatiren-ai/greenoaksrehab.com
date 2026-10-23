"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartLink() {
  const { count, ready } = useCart();
  return (
    <Link href="/cart" className="cart-link" aria-label={`Cart, ${ready ? count : 0} items`}>
      Cart ({ready ? count : 0})
    </Link>
  );
}
