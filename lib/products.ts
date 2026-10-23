// Catalog. Prices are in cents and are the ONLY source of truth: the server recomputes every
// order total from this file, so a customer cannot change a price from the browser.
// EDIT NAMES / DESCRIPTIONS / PRICES to match your real offerings before launch.

export type Product = {
  id: string;
  kind: "service" | "product";
  name: string;
  description: string;
  priceCents: number;
  physical: boolean; // physical goods need a shipping address
};

export const products: Product[] = [
  {
    id: "initial-evaluation",
    kind: "service",
    name: "Initial Physical Therapy Evaluation",
    description:
      "A 60-minute one-on-one assessment of your injury, movement and goals, ending with a personalized recovery plan.",
    priceCents: 12000,
    physical: false,
  },
  {
    id: "follow-up-session",
    kind: "service",
    name: "Follow-up Therapy Session",
    description: "A 45-minute hands-on and guided-exercise session to progress your recovery plan.",
    priceCents: 9000,
    physical: false,
  },
  {
    id: "recovery-package-6",
    kind: "service",
    name: "6-Session Recovery Package",
    description: "Six 45-minute follow-up sessions at a package rate. Valid for 6 months from purchase.",
    priceCents: 48000,
    physical: false,
  },
  {
    id: "telehealth-consult",
    kind: "service",
    name: "Telehealth Movement Consult",
    description: "A 30-minute video consult for exercise guidance, form checks and progress reviews.",
    priceCents: 6000,
    physical: false,
  },
  {
    id: "resistance-band-set",
    kind: "product",
    name: "Resistance Band Set",
    description: "Five-level resistance band set with door anchor and exercise guide for home rehabilitation routines.",
    priceCents: 2400,
    physical: true,
  },
  {
    id: "foam-roller",
    kind: "product",
    name: "Foam Roller (36 in)",
    description: "Firm-density foam roller for mobility work and post-exercise recovery routines.",
    priceCents: 3200,
    physical: true,
  },
  {
    id: "hot-cold-pack",
    kind: "product",
    name: "Hot & Cold Gel Pack",
    description: "Reusable gel pack with soft cover; use warm or chilled as directed by your clinician.",
    priceCents: 1600,
    physical: true,
  },
  {
    id: "ankle-sleeve",
    kind: "product",
    name: "Compression Ankle Sleeve",
    description: "Breathable compression sleeve for everyday support during activity.",
    priceCents: 2200,
    physical: true,
  },
];

export const byId = (id: string) => products.find((p) => p.id === id);

export const money = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
