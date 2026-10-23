// End-to-end test harness for greenoaksrehab (not part of the shipped project).
// - PGlite (real Postgres engine, in-memory) behind a Neon-HTTP-compatible shim on :4100
// - Mock SparkPost + PayPal on :4101 (records every request)
// - next start on :4200 with env pointing at the mocks
import http from "node:http";
import { spawn } from "node:child_process";
const spawnAsync = (cmd, args, opts) => new Promise((resolve) => {
  const c = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "", stderr = "";
  c.stdout.on("data", (d) => (stdout += d)); c.stderr.on("data", (d) => (stderr += d));
  c.on("close", (status) => resolve({ status, stdout, stderr }));
});
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const PROJECT = new URL("../../", import.meta.url).pathname.replace(/\/$/, "");
const SITE = "http://localhost:4200";
const db = new PGlite();

// ---------- Neon HTTP shim ----------
const OIDS = [16, 17, 18, 19, 20, 21, 23, 25, 26, 114, 700, 701, 1042, 1043, 1082, 1083, 1114, 1184, 1186, 1700, 2950, 3802, 1009, 1007, 199, 3807];
const parsers = Object.fromEntries(OIDS.map((o) => [o, (v) => v]));
const readBody = (req) => new Promise((res) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => res(b)); });

const shim = http.createServer(async (req, res) => {
  const body = JSON.parse((await readBody(req)) || "{}");
  try {
    const r = await db.query(body.query, body.params || [], { rowMode: "array", parsers });
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({
      command: (body.query.trim().split(/\s+/)[0] || "").toUpperCase(),
      rowCount: r.affectedRows ?? r.rows.length,
      rows: r.rows,
      rowAsArray: true,
      fields: r.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID, tableID: 0, columnID: 0, dataTypeSize: -1, dataTypeModifier: -1, format: "text" })),
    }));
  } catch (e) {
    res.statusCode = 400;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ message: String(e.message), severity: "ERROR", code: "42000" }));
  }
});

// ---------- Mock SparkPost + PayPal ----------
const sent = []; // SparkPost transmissions
const ppOrders = {}; // PayPal orders by id
let ppCounter = 0;
let ppCaptureAmountOverride = null;
const mock = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const raw = await readBody(req);
  const json = (o, s = 200) => { res.statusCode = s; res.setHeader("content-type", "application/json"); res.end(JSON.stringify(o)); };
  if (url.pathname === "/api/v1/transmissions") {
    const b = JSON.parse(raw);
    sent.push({ auth: req.headers.authorization, ...b });
    return json({ results: { id: "tx" + sent.length, total_accepted_recipients: 1 } });
  }
  if (url.pathname === "/v1/oauth2/token") return json({ access_token: "mock-token" });
  if (url.pathname === "/v2/checkout/orders" && req.method === "POST") {
    const b = JSON.parse(raw);
    const id = "PPORDER" + ++ppCounter;
    ppOrders[id] = b;
    return json({ id, status: "CREATED" });
  }
  const m = url.pathname.match(/^\/v2\/checkout\/orders\/([^/]+)\/capture$/);
  if (m) {
    const o = ppOrders[m[1]];
    if (!o) return json({ name: "RESOURCE_NOT_FOUND" }, 404);
    const amt = o.purchase_units[0].amount;
    return json({
      status: "COMPLETED",
      payer: { email_address: "buyer@example.com", name: { given_name: "Pat", surname: "Buyer" } },
      purchase_units: [{ shipping: { address: { address_line_1: "1 Test St" } }, payments: { captures: [{ id: "CAP1", status: "COMPLETED", amount: { value: ppCaptureAmountOverride ?? amt.value, currency_code: amt.currency_code } }] } }],
    });
  }
  json({ error: "not mocked " + url.pathname }, 404);
});

await new Promise((r) => shim.listen(4100, r));
await new Promise((r) => mock.listen(4101, r));

// ---------- env ----------
const env = {
  ...process.env,
  NODE_ENV: "production",
  NEXT_PUBLIC_SITE_URL: SITE,
  COMPANY_NAME: "Green Oaks Rehab",
  COMPANY_LEGAL_NAME: "Test Rehab LLC",
  COMPANY_ADDRESS_LINE1: "100 Test Street",
  COMPANY_CITY: "Testville",
  COMPANY_REGION: "TX",
  COMPANY_POSTAL: "75001",
  COMPANY_COUNTRY: "USA",
  COMPANY_PHONE: "(555) 010-0199",
  COMPANY_PHONE_E164: "+15550100199",
  COMPANY_CONTACT_EMAIL: "office@test-rehab.example",
  DATABASE_URL: "postgres://u:p@localhost:4100/db",
  NEON_LOCAL_HTTP_ENDPOINT: "http://localhost:4100/sql",
  TOKEN_SECRET: "x".repeat(48),
  ADMIN_TOKEN: "admin-token-1234567890",
  PAYPAL_ENV: "sandbox",
  PAYPAL_API_BASE: "http://localhost:4101",
  PAYPAL_CLIENT_ID: "cid",
  NEXT_PUBLIC_PAYPAL_CLIENT_ID: "cid",
  PAYPAL_CLIENT_SECRET: "sec",
  SPARKPOST_API_KEY: "testkey",
  SPARKPOST_API_URL: "http://localhost:4101",
  MAIL_FROM_EMAIL: "hello@greenoaksrehab.com",
  MAIL_RETURN_PATH: "bounce@bounce.greenoaksrehab.com",
  SPARKPOST_WEBHOOK_USER: "hook",
  SPARKPOST_WEBHOOK_PASS: "p:ass",
};

let pass = 0, fail = 0;
const ok = (cond, label, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}${!cond && extra ? "  -> " + extra : ""}`); };
let ipn = 0;
const post = (path, body, headers = {}, raw = false) =>
  fetch(SITE + path, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${++ipn}`, ...headers }, body: raw ? body : JSON.stringify(body) });
const rows = async (sql, p = []) => (await db.query(sql, p)).rows;

// ---------- migrate through the shim using the real script ----------
const mig = await spawnAsync(process.execPath, ["scripts/migrate.mjs"], { cwd: PROJECT, env });
ok(mig.status === 0, "migrate.mjs applies schema.sql", mig.stdout + mig.stderr);
const mig2 = await spawnAsync(process.execPath, ["scripts/migrate.mjs"], { cwd: PROJECT, env });
ok(mig2.status === 0, "migrate.mjs is re-runnable");

// ---------- build + start ----------
const build = await spawnAsync("npx", ["next", "build"], { cwd: PROJECT, env });
ok(build.status === 0, "next build with real-looking env", build.stdout.slice(-800) + build.stderr.slice(-800));
const server = spawn("npx", ["next", "start", "-p", "4200"], { cwd: PROJECT, env, stdio: "ignore" });
for (let i = 0; i < 60; i++) { try { const r = await fetch(SITE + "/"); if (r.ok) break; } catch {} await new Promise((r) => setTimeout(r, 500)); }

async function run() {
  // ----- pages -----
  for (const p of ["/", "/about", "/contact", "/privacy", "/terms", "/cookies", "/services", "/shop", "/cart", "/checkout", "/robots.txt", "/sitemap.xml", "/unsubscribe?t=x", "/subscribe/confirm?token=x"]) {
    const r = await fetch(SITE + p);
    ok(r.status === 200, `GET ${p} -> 200`, String(r.status));
  }
  ok((await fetch(SITE + "/nope")).status === 404, "unknown page -> 404");
  const home = await (await fetch(SITE + "/")).text();
  ok(home.includes("100 Test Street") && home.includes("(555) 010-0199"), "home footer shows real address + phone");
  const contact = await (await fetch(SITE + "/contact")).text();
  ok(contact.includes("Testville") && contact.includes("office@test-rehab.example"), "contact page shows company details");
  const priv = await (await fetch(SITE + "/privacy")).text();
  ok(priv.includes("Test Rehab LLC") && priv.includes("suppression list"), "privacy policy mentions company + suppression");
  const h = (await fetch(SITE + "/")).headers;
  ok(/max-age=\d+/.test(h.get("strict-transport-security") || ""), "HSTS header present");
  ok(h.get("x-content-type-options") === "nosniff", "nosniff header present");
  ok(home.includes('name="') || home.includes("type=\"email\""), "signup form rendered on home");

  // ----- subscribe (double opt-in) -----
  ok((await post("/api/subscribe", { email: "bad", consent: true })).status === 400, "subscribe rejects invalid email");
  ok((await post("/api/subscribe", { email: "a@example.com", consent: false })).status === 400, "subscribe requires consent tick");
  ok((await post("/api/subscribe", { email: "bot@example.com", consent: true, website: "spam" })).status === 200 && (await rows("select 1 from subscribers where email='bot@example.com'")).length === 0, "honeypot silently ignored, nothing stored");
  const before = sent.length;
  const r1 = await post("/api/subscribe", { email: "Alice@Example.com", consent: true, source: "test" });
  ok(r1.status === 200, "subscribe valid -> 200");
  let sub = (await rows("select * from subscribers where email='alice@example.com'"))[0];
  ok(sub && sub.status === "pending", "subscriber stored as PENDING (not active) until confirmed", JSON.stringify(sub));
  ok(sub && sub.consent_text.includes("agree to receive") && sub.consent_ip && sub.consent_at, "consent text, IP, timestamp recorded");
  const confirmMail = sent[sent.length - 1];
  ok(sent.length === before + 1 && confirmMail.recipients[0].address.email === "alice@example.com", "confirmation email sent to subscriber");
  ok(/confirm/i.test(confirmMail.content.subject) && confirmMail.options.transactional === true, "confirmation email subject + transactional flag");
  ok(!("headers" in confirmMail.content), "confirmation email has no unsubscribe header (not marketing)");
  ok(confirmMail.content.html.includes("100 Test Street") && confirmMail.content.text.includes("100 Test Street"), "confirmation email footer has physical address");
  const link = confirmMail.content.html.match(/href="([^"]*\/subscribe\/confirm\?token=[a-f0-9]+)"/)?.[1];
  ok(!!link, "confirmation link present", confirmMail.content.html.slice(0, 300));
  ok((await post("/api/confirm", { token: "f".repeat(64) })).status === 400, "confirm with wrong token rejected");
  ok((await fetch(link)).status === 200 && (await rows("select status from subscribers where email='alice@example.com'"))[0].status === "pending", "opening link alone (GET) does NOT confirm");
  const token = link.split("token=")[1];
  const c = await post("/api/confirm", { token });
  ok(c.status === 200, "confirm with right token -> 200");
  sub = (await rows("select * from subscribers where email='alice@example.com'"))[0];
  ok(sub.status === "active" && sub.confirmed_at && sub.confirm_token === null, "subscriber now ACTIVE, token cleared");
  ok((await post("/api/confirm", { token })).status === 400, "confirm token cannot be reused");
  const welcome = sent[sent.length - 1];
  ok(/subscribed/i.test(welcome.content.subject), "welcome email sent");
  ok(/^<https:\/\/|^<http:\/\/localhost/.test(welcome.content.headers?.["List-Unsubscribe"] || "") && welcome.content.headers?.["List-Unsubscribe-Post"] === "List-Unsubscribe=One-Click", "welcome email has RFC 8058 one-click List-Unsubscribe headers", JSON.stringify(welcome.content.headers));
  ok(welcome.return_path === "bounce@bounce.greenoaksrehab.com", "return_path (bounce domain) set on transmission");
  ok(welcome.options.open_tracking === false && welcome.options.click_tracking === false, "open/click tracking disabled");
  ok(welcome.auth === "testkey", "SparkPost API key sent");

  // ----- unsubscribe -----
  const unsubUrl = welcome.content.html.match(/href="([^"]*\/unsubscribe\?t=[^"]+)"/)?.[1];
  ok(!!unsubUrl, "welcome email body has visible unsubscribe link");
  const t = decodeURIComponent(unsubUrl.split("t=")[1]);
  ok((await post("/api/unsubscribe?t=garbage", {})).status === 400, "forged unsubscribe token rejected");
  const oneClick = await post(`/api/unsubscribe?t=${encodeURIComponent(t)}`, "List-Unsubscribe=One-Click", { "content-type": "application/x-www-form-urlencoded" }, true);
  ok(oneClick.status === 200, "one-click unsubscribe POST (mail client style) works");
  sub = (await rows("select * from subscribers where email='alice@example.com'"))[0];
  ok(sub.status === "unsubscribed" && sub.unsubscribed_at, "subscriber marked UNSUBSCRIBED");
  ok((await rows("select reason from suppression where email='alice@example.com'"))[0]?.reason === "unsubscribe", "unsubscribed address stored in suppression table");
  ok((await fetch(SITE + "/api/unsubscribe?t=" + encodeURIComponent(t))).status === 405, "GET on unsubscribe API does nothing (405)");

  // ----- broadcast -----
  ok((await post("/api/admin/broadcast", { subject: "s", html: "<p>x</p>" })).status === 401, "broadcast without token -> 401");
  const dry = await (await post("/api/admin/broadcast", { subject: "s", html: "<p>x</p>", dryRun: true }, { authorization: "Bearer admin-token-1234567890" })).json();
  ok(dry.recipients === 0, "unsubscribed person excluded from broadcast", JSON.stringify(dry));

  // re-subscribe after unsubscribing (allowed, via fresh double opt-in)
  await post("/api/subscribe", { email: "alice@example.com", consent: true });
  const reMail = sent[sent.length - 1];
  const reTok = reMail.content.html.match(/token=([a-f0-9]+)/)[1];
  await post("/api/confirm", { token: reTok });
  sub = (await rows("select status from subscribers where email='alice@example.com'"))[0];
  ok(sub.status === "active" && (await rows("select 1 from suppression where email='alice@example.com'")).length === 0, "re-subscribe via double opt-in re-activates and lifts unsubscribe suppression");

  // more subscribers for webhook tests
  for (const e of ["bounce@example.com", "complaint@example.com", "soft@example.com", "lu@example.com", "keep@example.com"]) {
    await post("/api/subscribe", { email: e, consent: true });
    const tk = sent[sent.length - 1].content.html.match(/token=([a-f0-9]+)/)[1];
    await post("/api/confirm", { token: tk });
  }

  // ----- SparkPost webhook -----
  const auth = "Basic " + Buffer.from("hook:p:ass").toString("base64");
  ok((await post("/api/webhooks/sparkpost", [])).status === 401, "webhook without auth -> 401");
  ok((await post("/api/webhooks/sparkpost", [], { authorization: "Basic " + Buffer.from("hook:wrong").toString("base64") })).status === 401, "webhook wrong password -> 401");
  ok((await post("/api/webhooks/sparkpost", [{ msys: {} }], { authorization: auth })).status === 200, "webhook test ping -> 200");
  const batch = [
    { msys: { message_event: { type: "bounce", bounce_class: "10", rcpt_to: "bounce@example.com", reason: "550 5.1.1 user unknown" } } },
    { msys: { message_event: { type: "spam_complaint", rcpt_to: "complaint@example.com", fbtype: "abuse" } } },
    { msys: { unsubscribe_event: { type: "list_unsubscribe", rcpt_to: "lu@example.com" } } },
    { msys: { message_event: { type: "bounce", bounce_class: "22", rcpt_to: "soft@example.com", reason: "mailbox full" } } },
    { msys: { message_event: { type: "delivery", rcpt_to: "keep@example.com" } } },
  ];
  ok((await post("/api/webhooks/sparkpost", batch, { authorization: auth })).status === 200, "webhook batch accepted");
  const supp = Object.fromEntries((await rows("select email, reason from suppression")).map((r) => [r.email, r.reason]));
  ok(supp["bounce@example.com"] === "bounce", "HARD bounce -> suppression(bounce)", JSON.stringify(supp));
  ok(supp["complaint@example.com"] === "complaint", "spam complaint -> suppression(complaint)");
  ok(supp["lu@example.com"] === "unsubscribe", "list_unsubscribe event -> suppression(unsubscribe)");
  ok(!supp["soft@example.com"], "single SOFT bounce does not suppress");
  for (let i = 0; i < 2; i++) await post("/api/webhooks/sparkpost", [batch[3]], { authorization: auth });
  ok((await rows("select reason from suppression where email='soft@example.com'"))[0]?.reason === "bounce", "3 soft bounces -> suppressed");
  ok((await rows("select status from subscribers where email='bounce@example.com'"))[0].status === "suppressed", "bounced subscriber status = suppressed");
  ok((await rows("select status from subscribers where email='complaint@example.com'"))[0].status === "suppressed", "complaining subscriber status = suppressed");
  ok((await rows("select count(*)::int n from email_events"))[0].n >= 5, "bounce/complaint events logged in email_events");
  const n0 = sent.length;
  await post("/api/subscribe", { email: "complaint@example.com", consent: true });
  await post("/api/subscribe", { email: "bounce@example.com", consent: true });
  ok(sent.length === n0, "complainer / hard-bounced address can never be re-subscribed (no email sent)");

  // ----- broadcast real send -----
  const dry2 = await (await post("/api/admin/broadcast", { subject: "s", html: "<p>x</p>", dryRun: true }, { authorization: "Bearer admin-token-1234567890" })).json();
  ok(dry2.recipients === 2, "broadcast audience = only active, non-suppressed (alice + keep)", JSON.stringify(dry2));
  const nb = sent.length;
  const bc = await (await post("/api/admin/broadcast", { subject: "October tips", html: "<p>Hello!</p>" }, { authorization: "Bearer admin-token-1234567890" })).json();
  ok(bc.sent === 2 && bc.failed === 0, "broadcast sent to 2", JSON.stringify(bc));
  const bmails = sent.slice(nb);
  ok(bmails.every((m) => m.options.transactional === false && m.content.headers?.["List-Unsubscribe-Post"]), "broadcast = marketing (non-transactional) with one-click headers");
  ok(bmails.every((m) => m.content.html.includes("100 Test Street") && m.content.html.includes("/unsubscribe?t=")), "broadcast footer has address + unsubscribe link");
  ok(new Set(bmails.map((m) => m.content.headers["List-Unsubscribe"])).size === 2, "each recipient gets own signed unsubscribe URL");

  // ----- contact -----
  ok((await post("/api/contact", { name: "", email: "x", message: "" })).status === 400, "contact validates input");
  const nc = sent.length;
  ok((await post("/api/contact", { name: "Bob", email: "bob@example.com", phone: "123", message: "Do you take new patients?" })).status === 200, "contact valid -> 200");
  ok((await rows("select 1 from contact_messages where email='bob@example.com'")).length === 1, "contact message stored");
  const cm = sent[sent.length - 1];
  ok(sent.length === nc + 1 && cm.recipients[0].address.email === "office@test-rehab.example" && cm.content.reply_to === "bob@example.com", "contact emailed to company inbox with Reply-To = visitor");

  // ----- PayPal / orders -----
  ok((await post("/api/paypal/create-order", { items: [] })).status === 400, "create-order rejects empty cart");
  ok((await post("/api/paypal/create-order", { items: [{ id: "nope", qty: 1 }] })).status === 400, "create-order rejects unknown product");
  const co = await post("/api/paypal/create-order", { items: [{ id: "initial-evaluation", qty: 1, priceCents: 1 }, { id: "foam-roller", qty: 1, price: 1 }] });
  const cod = await co.json();
  ok(co.status === 200 && cod.id === "PPORDER1", "create-order -> PayPal order id", JSON.stringify(cod));
  const pu = ppOrders.PPORDER1.purchase_units[0];
  ok(pu.amount.value === "158.95" && pu.amount.breakdown.item_total.value === "152.00" && pu.amount.breakdown.shipping.value === "6.95", "server-computed totals sent to PayPal (client-supplied prices ignored)", JSON.stringify(pu.amount));
  ok(ppOrders.PPORDER1.application_context.shipping_preference === "GET_FROM_FILE", "physical item -> shipping address requested");
  const co2 = await (await post("/api/paypal/create-order", { items: [{ id: "telehealth-consult", qty: 2 }] })).json();
  ok(ppOrders[co2.id].application_context.shipping_preference === "NO_SHIPPING" && ppOrders[co2.id].purchase_units[0].amount.breakdown.shipping.value === "0.00", "services-only order -> no shipping charge");
  ok((await rows("select status from orders where paypal_order_id='PPORDER1'"))[0].status === "created", "order stored as 'created'");
  ok((await post("/api/paypal/capture-order", { orderID: "DOESNOTEXIST" })).status === 404, "capture unknown order -> 404");
  const np = sent.length;
  const cap = await post("/api/paypal/capture-order", { orderID: "PPORDER1" });
  const capd = await cap.json();
  ok(cap.status === 200 && capd.ok && /^GO-[0-9A-F]{8}$/.test(capd.ref), "capture-order -> ok + order ref", JSON.stringify(capd));
  const o = (await rows("select * from orders where paypal_order_id='PPORDER1'"))[0];
  ok(o.status === "paid" && o.payer_email === "buyer@example.com" && o.paypal_capture_id === "CAP1", "order marked PAID with payer info");
  const receipts = sent.slice(np);
  ok(receipts.some((m) => m.recipients[0].address.email === "buyer@example.com" && m.content.subject.includes(capd.ref)), "receipt emailed to buyer");
  ok(receipts.some((m) => m.recipients[0].address.email === "office@test-rehab.example"), "new-order notification emailed to staff");
  const ne = sent.length;
  ok((await (await post("/api/paypal/capture-order", { orderID: "PPORDER1" })).json()).ok === true && sent.length === ne, "repeat capture is idempotent (no duplicate emails)");
  ppCaptureAmountOverride = "1.00";
  const co3 = await (await post("/api/paypal/create-order", { items: [{ id: "follow-up-session", qty: 1 }] })).json();
  const bad = await post("/api/paypal/capture-order", { orderID: co3.id });
  ok(bad.status === 402 && (await rows("select status from orders where paypal_order_id=$1", [co3.id]))[0].status === "failed", "amount mismatch -> NOT marked paid (402, failed)");
  ppCaptureAmountOverride = null;
  const oc = await fetch(SITE + `/order-complete?ref=${capd.ref}`);
  ok(oc.status === 200 && (await oc.text()).includes(capd.ref), "order-complete page shows reference");
}

try { await run(); } catch (e) { fail++; console.log("FAIL  harness exception:", e); }
console.log(`\n${pass} passed, ${fail} failed`);
server.kill();
shim.close(); mock.close();
process.exit(fail ? 1 : 0);
