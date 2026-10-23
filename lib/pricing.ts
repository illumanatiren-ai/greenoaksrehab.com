import { commerce } from "./config";
import { byId, Product } from "./products";

export type CartLine = { id: string; qty: number };
export type PricedLine = { product: Product; qty: number };

export type Priced = {
  lines: PricedLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  needsShipping: boolean;
};

/** Validates a client cart against the catalog and computes authoritative totals. */
export function priceCart(input: unknown): Priced | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > 25) return null;
  const merged = new Map<string, number>();
  for (const raw of input) {
    const id = typeof raw?.id === "string" ? raw.id : "";
    const qty = Number(raw?.qty);
    if (!byId(id) || !Number.isInteger(qty) || qty < 1 || qty > 20) return null;
    merged.set(id, Math.min(20, (merged.get(id) || 0) + qty));
  }
  const lines: PricedLine[] = [...merged.entries()].map(([id, qty]) => ({ product: byId(id)!, qty }));
  const subtotalCents = lines.reduce((s, l) => s + l.product.priceCents * l.qty, 0);
  const physicalSubtotal = lines.filter((l) => l.product.physical).reduce((s, l) => s + l.product.priceCents * l.qty, 0);
  const needsShipping = lines.some((l) => l.product.physical);
  const shippingCents = !needsShipping ? 0 : physicalSubtotal >= commerce.freeShippingOverCents ? 0 : commerce.shippingFlatCents;
  return { lines, subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents, needsShipping };
}
