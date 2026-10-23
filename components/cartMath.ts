import type { Product } from "@/lib/products";

export type Line = { product: Product; qty: number };

/** Display-only totals. The server recomputes everything from the catalog (lib/pricing.ts) before charging. */
export function totals(lines: Line[], flatCents: number, freeOverCents: number) {
  const subtotal = lines.reduce((s, l) => s + l.product.priceCents * l.qty, 0);
  const physical = lines.filter((l) => l.product.physical).reduce((s, l) => s + l.product.priceCents * l.qty, 0);
  const needsShipping = lines.some((l) => l.product.physical);
  const shipping = !needsShipping ? 0 : physical >= freeOverCents ? 0 : flatCents;
  return { subtotal, shipping, total: subtotal + shipping, needsShipping };
}
