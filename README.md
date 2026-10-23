# Green Oaks Rehab: greenoaksrehab.com

Physical-therapy & recovery website with a shop, PayPal checkout and a compliant double opt-in email system.

**Stack:** Next.js 15 (App Router) on Vercel · Neon Postgres · PayPal Checkout · SparkPost email.

**To go live, follow [`docs/LAUNCH-GUIDE.md`](docs/LAUNCH-GUIDE.md).** It covers real company details, deployment, PayPal, DNS (SPF/DKIM/DMARC/bounce domain), the SparkPost webhook and a pre-launch checklist.

```bash
npm install
cp .env.example .env.local      # fill in values
npm run db:migrate              # creates the tables
npm run dev                     # http://localhost:3000
npm run typecheck
npm run test:e2e                # ~90 end-to-end checks against mock SparkPost/PayPal
npm run check:launch            # fails until every production setting is real
DKIM_SELECTOR=scph1023 npm run check:dns
```

| Folder | Contents |
|---|---|
| `app/` | Pages (home, services, shop, cart, checkout, about, contact, privacy, terms, cookies, confirm/unsubscribe) and API routes |
| `app/api/` | `subscribe`, `confirm`, `unsubscribe`, `contact`, `paypal/*`, `webhooks/sparkpost`, `admin/broadcast` |
| `lib/products.ts` | **Catalog: edit your real services/products/prices here** |
| `lib/config.ts` | Company information (from env vars) |
| `lib/suppression.ts`, `lib/sparkpost.ts` | Suppression database + email sending (checked before every send) |
| `schema.sql` | Database tables |
| `scripts/` | Migration, DNS check, launch gate |
