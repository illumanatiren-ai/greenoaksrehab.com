// Verifies the email-authentication DNS records for the sending domain.
// Usage: DKIM_SELECTOR=scph1022 node scripts/check-dns.mjs [domain]
import { promises as dns } from "node:dns";

const domain = process.argv[2] || "greenoaksrehab.com";
const selector = process.env.DKIM_SELECTOR;
const bounceHost = `bounce.${domain}`;
let failed = 0;

const flat = (records) => records.map((r) => r.join(""));
const report = (ok, label, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  -> " + detail : ""}`);
};

async function txt(name) {
  try {
    return flat(await dns.resolveTxt(name));
  } catch {
    return [];
  }
}

// SPF
const spf = (await txt(domain)).filter((t) => t.startsWith("v=spf1"));
report(spf.length === 1, "SPF record (exactly one)", spf.join(" | ") || "missing");
if (spf[0]) report(/sparkpostmail\.com/.test(spf[0]), "SPF includes SparkPost", spf[0]);

// DKIM
if (!selector) {
  report(false, "DKIM", "set DKIM_SELECTOR to the selector shown in SparkPost");
} else {
  const dkim = await txt(`${selector}._domainkey.${domain}`);
  report(dkim.some((t) => t.includes("v=DKIM1") && t.includes("p=")), `DKIM ${selector}._domainkey.${domain}`, dkim[0]?.slice(0, 60) || "missing");
}

// DMARC
const dmarc = (await txt(`_dmarc.${domain}`)).filter((t) => t.startsWith("v=DMARC1"));
report(dmarc.length === 1, "DMARC record", dmarc[0] || "missing");
if (dmarc[0]) report(/rua=mailto:/.test(dmarc[0]), "DMARC has aggregate reporting (rua)");

// Bounce domain
try {
  const cname = await dns.resolveCname(bounceHost);
  report(cname.some((c) => /sparkpostmail\.com$/.test(c)), `Bounce domain CNAME ${bounceHost}`, cname.join(", "));
} catch {
  report(false, `Bounce domain CNAME ${bounceHost}`, "missing");
}

// Web
try {
  const a = await dns.resolve4(domain);
  report(a.length > 0, `A record for ${domain}`, a.join(", "));
} catch {
  report(false, `A record for ${domain}`, "missing");
}
try {
  const c = await dns.resolveCname(`www.${domain}`);
  report(c.length > 0, `www CNAME`, c.join(", "));
} catch {
  report(false, "www CNAME", "missing");
}

process.exit(failed ? 1 : 0);
