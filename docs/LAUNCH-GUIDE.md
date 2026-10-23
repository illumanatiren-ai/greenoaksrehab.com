# Green Oaks Rehab: launch guide for greenoaksrehab.com

Everything in the code is finished and tested. What remains are the steps that need **your accounts** (Vercel, PayPal, SparkPost, your DNS host) and **your real business details**. Follow these in order.

## 0. Requirement checklist

| Requirement | Where it lives |
|---|---|
| Fully functional website | Next.js app, `app/` |
| HTTPS | Vercel issues the certificate automatically; HSTS header in `next.config.mjs` |
| About / Contact pages | `app/about`, `app/contact` (contact form stores the message and emails your inbox) |
| Privacy Policy / Terms / Cookie Policy | `app/privacy`, `app/terms` (includes shipping & returns), `app/cookies`; cookie notice banner |
| Clear products/services | `lib/products.ts` (edit names, descriptions, prices), `/services`, `/shop` |
| Shopping cart + payment gateway | Cart in browser; **PayPal** checkout; server recomputes every price and verifies the captured amount |
| Real company information | Env vars `COMPANY_*` → footer, Contact, About, legal pages, every email footer |
| Email signup + consent language + double opt-in | Footer/home forms; unchecked consent box with the exact wording stored; confirmation email; subscription only active after the confirm click |
| Easy unsubscribe | Link in every email → one visit unsubscribes; plus RFC 8058 one-click `List-Unsubscribe` headers |
| SPF / DKIM / DMARC | DNS records in section 4 |
| Bounce processing / complaint processing | SparkPost webhook → `/api/webhooks/sparkpost` |
| Suppression database | `suppression` table, checked before **every** email |

## 1. Put in your real business details (required)

The site never invents company data. Until you set these, it shows `[SET ...]` markers, and **a Vercel production build is blocked** (see `scripts/check-launch.mjs`) so placeholders cannot go live.

Set in Vercel → Project → Settings → Environment Variables (see `.env.example` for every key):
`COMPANY_LEGAL_NAME`, `COMPANY_ADDRESS_LINE1/2`, `COMPANY_CITY`, `COMPANY_REGION`, `COMPANY_POSTAL`, `COMPANY_COUNTRY`, `COMPANY_PHONE`, `COMPANY_PHONE_E164`, `COMPANY_CONTACT_EMAIL`, optional `COMPANY_HOURS`.

Use a real, staffed address and a phone number that is answered. Ad networks, PayPal and mailbox providers all check this.

Pages are pre-rendered, so after changing any `COMPANY_*` value, **redeploy**.

## 2. Edit what you sell

`lib/products.ts` ships with **sample** services and gear and sample prices. Replace them with your real offerings (`id`, `name`, `description`, `priceCents`, `physical`). Prices are only ever read from this file on the server.

Business policies I wrote into the Terms as sensible defaults. **Confirm or edit them** in `app/terms/page.tsx` so the site says what you actually do:
24-hour reschedule notice · packages valid 6 months · dispatch within 3 business days · 30-day returns on unused products · no returns on used compression wear/gel packs · 14-day refund on unused services · shipping flat rate and free threshold (env `SHIPPING_FLAT_CENTS`, `FREE_SHIPPING_OVER_CENTS`).

Have a lawyer review Privacy, Terms and Cookie pages. They are solid general-purpose drafts, not legal advice. If you handle patient records, HIPAA (or your local equivalent) applies to your clinical systems; this website is built so it does not collect health records.

## 3. Deploy

1. Push this folder to a GitHub repo and import it in Vercel (framework: Next.js).
2. Add a Postgres database: Vercel → Storage → Neon (sets `DATABASE_URL`). Then, from your machine, with `DATABASE_URL` in `.env.local`:
   `npm install && npm run db:migrate`
3. Add all other env vars from `.env.example` (generate secrets with `openssl rand -base64 48`).
4. Vercel → Domains: add `greenoaksrehab.com` and `www.greenoaksrehab.com`; set `www` → redirect to apex (or the reverse). Add the DNS records Vercel shows at your DNS host (typically `A @ 76.76.21.21` and `CNAME www cname.vercel-dns.com`; use exactly what Vercel displays). HTTPS certificate is issued automatically.
5. **PayPal:** create an app at developer.paypal.com. Test first in **sandbox** (`PAYPAL_ENV=sandbox`, sandbox client ID/secret) on a Preview deployment: do a test purchase. For launch, switch to the **Live** client ID/secret and `PAYPAL_ENV=live`. `PAYPAL_CLIENT_ID` and `NEXT_PUBLIC_PAYPAL_CLIENT_ID` must be the same value.

## 4. Email domain setup (DNS)

Create a SparkPost account → **Configuration → Sending Domains → Add** `greenoaksrehab.com`. SparkPost then shows the exact values below. Add them at your DNS host. EU accounts use `api.eu.sparkpost.com` (set `SPARKPOST_API_URL`) and `eu.sparkpostmail.com`.

| Purpose | Type | Host | Value |
|---|---|---|---|
| **SPF** | TXT | `@` | `v=spf1 include:sparkpostmail.com ~all` (if you already have an SPF record, e.g. for Google Workspace, **merge**: `v=spf1 include:_spf.google.com include:sparkpostmail.com ~all`. There must be exactly one SPF record.) |
| **DKIM** | TXT | `<selector>._domainkey` (SparkPost shows the selector, e.g. `scph1023`) | `v=DKIM1; k=rsa; h=sha256; p=...` (copy from SparkPost) |
| **Bounce domain** (Return-Path, makes SPF align with your domain) | CNAME | `bounce` | `sparkpostmail.com` (EU: `eu.sparkpostmail.com`). Then in SparkPost mark it as the bounce domain and set `MAIL_RETURN_PATH=bounce@bounce.greenoaksrehab.com` |
| **DMARC** | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@greenoaksrehab.com; fo=1` |
| Inbound mail | MX | `@` | Your mailbox provider (Google Workspace, Zoho, …). You need real mailboxes for `hello@`, `dmarc@` and `COMPANY_CONTACT_EMAIL` |

DMARC roll-out: start with `p=none` and read the reports for 2–4 weeks; when SPF and DKIM both pass for all your mail, move to `p=quarantine`, later `p=reject`.

In SparkPost, click **Verify** on the sending domain (DKIM and bounce). Then check everything from here:
`DKIM_SELECTOR=scph1023 npm run check:dns`
(also test at mail-tester.com by sending yourself a mail, and register greenoaksrehab.com in Google Postmaster Tools).

## 5. Bounce and complaint processing (SparkPost webhook)

SparkPost → **Account → Webhooks → New Webhook**:
- Target: `https://greenoaksrehab.com/api/webhooks/sparkpost`
- Authentication: **Basic**, user/password = `SPARKPOST_WEBHOOK_USER` / `SPARKPOST_WEBHOOK_PASS`
- Events: Bounce, Out of Band, Spam Complaint, Policy Rejection, List Unsubscribe, Link Unsubscribe

What the site does with them:
- Hard bounce (classes 10, 25, 30, 90) → suppressed immediately, never emailed again, not even receipts.
- Soft bounce (temporary: mailbox full, DNS, timeout, undetermined) → counted; suppressed after 3.
- Spam complaint → suppressed permanently; cannot re-subscribe.
- One-click/list unsubscribe from the mail client → suppressed (marketing only).
- Everything is logged in `email_events`.

SparkPost also keeps its own suppression list for non-transactional mail; our table is the one the site checks first.

## 6. Suppression database

Table `suppression` (`email`, `reason` = bounce | complaint | unsubscribe | manual, `detail`, `created_at`). `lib/sparkpost.ts` calls it before every send:
- bounce / complaint / manual → blocks everything.
- unsubscribe → blocks marketing, still allows order receipts.
- Someone who unsubscribed can re-subscribe themselves through double opt-in; bounced/complained addresses cannot.

Add one manually: `insert into suppression (email, reason, detail) values ('x@y.com','manual','requested by phone');`

## 7. Sending a newsletter

```
curl -X POST https://greenoaksrehab.com/api/admin/broadcast \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"subject":"October recovery tips","html":"<p>Hello!</p>","dryRun":true}'
```
`dryRun:true` only counts recipients; remove it to send. Every message gets your address in the footer, a personal unsubscribe link and the one-click headers. Warm up gradually: small sends first, grow over a few weeks.

## 8. Final pre-launch checklist

- [ ] `npm run check:launch` passes (with production env)
- [ ] Real address & phone visible in footer and on Contact
- [ ] Sandbox purchase works end to end; then live PayPal and one real small purchase + refund
- [ ] Sign up with a Gmail and an Outlook address: confirmation arrives in the inbox, link works, welcome mail arrives, Gmail shows an "Unsubscribe" button, unsubscribe works
- [ ] `npm run check:dns` all PASS; DMARC reports arrive
- [ ] SparkPost webhook shows 200 responses
- [ ] Contact form message reaches `COMPANY_CONTACT_EMAIL`

## 9. Tests

`npm run test:e2e` starts the real site against an in-memory Postgres plus mock SparkPost and PayPal and checks ~90 behaviours (double opt-in, unsubscribe, suppression, webhook, checkout totals, receipts). Run it after any change.
