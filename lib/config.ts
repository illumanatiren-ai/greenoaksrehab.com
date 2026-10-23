// Central company/site configuration. Everything comes from environment variables so that
// real business details are never hard-coded. Missing values show a visible marker rather
// than invented data.
const env = (key: string, fallback: string) => process.env[key]?.trim() || fallback;

export const siteUrl = env("NEXT_PUBLIC_SITE_URL", "https://greenoaksrehab.com").replace(/\/$/, "");

export const company = {
  name: env("COMPANY_NAME", "Green Oaks Rehab"),
  legalName: env("COMPANY_LEGAL_NAME", "[SET COMPANY_LEGAL_NAME]"),
  addressLine1: env("COMPANY_ADDRESS_LINE1", "[SET COMPANY_ADDRESS_LINE1]"),
  addressLine2: env("COMPANY_ADDRESS_LINE2", ""),
  city: env("COMPANY_CITY", "[CITY]"),
  region: env("COMPANY_REGION", "[STATE]"),
  postal: env("COMPANY_POSTAL", "[ZIP]"),
  country: env("COMPANY_COUNTRY", "[COUNTRY]"),
  phone: env("COMPANY_PHONE", "[SET COMPANY_PHONE]"),
  phoneE164: env("COMPANY_PHONE_E164", ""),
  email: env("COMPANY_CONTACT_EMAIL", "info@greenoaksrehab.com"),
  hours: env("COMPANY_HOURS", ""),
};

export const fullAddress = [
  company.addressLine1,
  company.addressLine2,
  `${company.city}, ${company.region} ${company.postal}`,
  company.country,
]
  .filter(Boolean)
  .join(", ");

export const commerce = {
  currency: env("CURRENCY", "USD"),
  shippingFlatCents: Number(env("SHIPPING_FLAT_CENTS", "695")),
  freeShippingOverCents: Number(env("FREE_SHIPPING_OVER_CENTS", "7500")),
};

export const mail = {
  fromEmail: env("MAIL_FROM_EMAIL", "hello@greenoaksrehab.com"),
  fromName: env("MAIL_FROM_NAME", "Green Oaks Rehab"),
  returnPath: env("MAIL_RETURN_PATH", ""),
  apiUrl: env("SPARKPOST_API_URL", "https://api.sparkpost.com").replace(/\/$/, ""),
};

export const lastUpdated = "October 22, 2026";
