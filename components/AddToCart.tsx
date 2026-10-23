"use client";
import { useState } from "react";
import { useCart } from "./CartProvider";

export default function AddToCart({ id, label }: { id: string; label: string }) {
  const { add } = useCart();
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn small"
      onClick={() => {
        add(id);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      aria-label={`Add ${label} to cart`}
    >
      {done ? "Added ✓" : "Add to cart"}
    </button>
  );
}
