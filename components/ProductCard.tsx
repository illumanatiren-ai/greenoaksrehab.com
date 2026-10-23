import AddToCart from "./AddToCart";
import { commerce } from "@/lib/config";
import { money, type Product } from "@/lib/products";

export default function ProductCard({ p }: { p: Product }) {
  return (
    <article className="card">
      <span className="tag">{p.kind === "service" ? "Service" : "Product"}</span>
      <h3>{p.name}</h3>
      <p className="muted" style={{ margin: 0 }}>{p.description}</p>
      <div className="price">{money(p.priceCents, commerce.currency)}</div>
      <AddToCart id={p.id} label={p.name} />
    </article>
  );
}
