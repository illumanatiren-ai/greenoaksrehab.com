// Pre-launch gate: fails until every required setting is real.
const required = [
  "NEXT_PUBLIC_SITE_URL",
  "COMPANY_LEGAL_NAME",
  "COMPANY_ADDRESS_LINE1",
  "COMPANY_CITY",
  "COMPANY_REGION",
  "COMPANY_POSTAL",
  "COMPANY_COUNTRY",
  "COMPANY_PHONE",
  "COMPANY_PHONE_E164",
  "COMPANY_CONTACT_EMAIL",
  "DATABASE_URL",
  "TOKEN_SECRET",
  "ADMIN_TOKEN",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
  "SPARKPOST_API_KEY",
  "MAIL_FROM_EMAIL",
  "MAIL_RETURN_PATH",
  "SPARKPOST_WEBHOOK_USER",
  "SPARKPOST_WEBHOOK_PASS",
];

const problems = [];
for (const key of required) {
  if (!process.env[key] || !process.env[key].trim()) problems.push(`${key} is not set`);
}
if (process.env.TOKEN_SECRET && process.env.TOKEN_SECRET.length < 32) problems.push("TOKEN_SECRET should be 32+ characters");
if (process.env.PAYPAL_ENV !== "live") problems.push("PAYPAL_ENV is not 'live' (sandbox payments are not real money)");
if (process.env.PAYPAL_CLIENT_ID && process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_ID !== process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
  problems.push("PAYPAL_CLIENT_ID and NEXT_PUBLIC_PAYPAL_CLIENT_ID differ");
}
if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.startsWith("https://")) problems.push("NEXT_PUBLIC_SITE_URL must be https://");

if (problems.length) {
  console.error("NOT READY TO LAUNCH:\n - " + problems.join("\n - "));
  process.exit(1);
}
console.log("Launch configuration looks complete.");
