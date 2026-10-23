import { company, fullAddress, siteUrl } from "./config";
import { escapeHtml } from "./security";
import { money } from "./products";

export const consentText = () =>
  `I agree to receive email newsletters and updates from ${company.name} at the address I entered. ` +
  `I understand I will first receive a confirmation email, that I can unsubscribe at any time with one click, ` +
  `and that my data is handled as described in the Privacy Policy.`;

function layout(inner: string, footerExtra = ""): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#1d2b22">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden">
<tr><td style="background:#2f5d3f;color:#ffffff;padding:20px 28px;font-size:20px;font-weight:bold">${escapeHtml(company.name)}</td></tr>
<tr><td style="padding:28px;font-size:16px;line-height:1.55">${inner}</td></tr>
<tr><td style="padding:18px 28px;background:#f4f1ea;font-size:12px;line-height:1.5;color:#55645a">
${escapeHtml(company.legalName)} &middot; ${escapeHtml(fullAddress)} &middot; ${escapeHtml(company.phone)}<br>
${footerExtra}
</td></tr></table></td></tr></table></body></html>`;
}

const footerText = () => `\n--\n${company.legalName}\n${fullAddress}\n${company.phone}\n`;

export function confirmEmail(confirmUrl: string) {
  return {
    subject: `Please confirm your subscription to ${company.name}`,
    html: layout(
      `<p>Thanks for signing up for updates from ${escapeHtml(company.name)}.</p>
<p>To finish subscribing, please confirm your email address:</p>
<p style="margin:24px 0"><a href="${confirmUrl}" style="background:#2f5d3f;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:bold">Confirm my subscription</a></p>
<p>This link expires in 48 hours. If you did not request this, simply ignore this email — you will not be subscribed and will not hear from us.</p>`,
      "You received this because someone entered this address on " + escapeHtml(siteUrl) + "."
    ),
    text: `Thanks for signing up for updates from ${company.name}.\n\nConfirm your subscription: ${confirmUrl}\n\nThis link expires in 48 hours. If you did not request this, ignore this email and you will not be subscribed.${footerText()}`,
  };
}

export function welcomeEmail(unsubUrl: string) {
  return {
    subject: `You're subscribed to ${company.name}`,
    html: layout(
      `<p>Your subscription is confirmed. You'll hear from us with recovery tips, news and offers.</p>
<p>Every email includes an unsubscribe link, and you can leave at any time.</p>`,
      `<a href="${unsubUrl}" style="color:#2f5d3f">Unsubscribe</a>`
    ),
    text: `Your subscription is confirmed. Unsubscribe any time: ${unsubUrl}${footerText()}`,
  };
}

export function newsletterWrap(htmlBody: string, textBody: string, unsubUrl: string) {
  return {
    html: layout(htmlBody, `You are receiving this because you subscribed at ${escapeHtml(siteUrl)}. <a href="${unsubUrl}" style="color:#2f5d3f">Unsubscribe</a>`),
    text: `${textBody}\n\nUnsubscribe: ${unsubUrl}${footerText()}`,
  };
}

type OrderItem = { name: string; qty: number; priceCents: number };

export function receiptEmail(ref: string, items: OrderItem[], shippingCents: number, totalCents: number, currency: string, needsShipping: boolean) {
  const rows = items
    .map((i) => `<tr><td style="padding:6px 0">${escapeHtml(i.name)} &times; ${i.qty}</td><td align="right">${money(i.priceCents * i.qty, currency)}</td></tr>`)
    .join("");
  const lines = items.map((i) => `${i.name} x ${i.qty}  ${money(i.priceCents * i.qty, currency)}`).join("\n");
  const next = needsShipping
    ? "Physical items will ship to the address on your PayPal order."
    : "";
  return {
    subject: `Your ${company.name} order ${ref}`,
    html: layout(
      `<p>Thank you for your order <strong>${escapeHtml(ref)}</strong>.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">${rows}
<tr><td style="padding:6px 0">Shipping</td><td align="right">${money(shippingCents, currency)}</td></tr>
<tr><td style="padding:10px 0;border-top:1px solid #ddd"><strong>Total</strong></td><td align="right" style="border-top:1px solid #ddd"><strong>${money(totalCents, currency)}</strong></td></tr></table>
<p>${escapeHtml(next)} For therapy services and packages, we will contact you to schedule your appointment. Questions? Reply to this email or call ${escapeHtml(company.phone)}.</p>`
    ),
    text: `Thank you for your order ${ref}.\n\n${lines}\nShipping ${money(shippingCents, currency)}\nTotal ${money(totalCents, currency)}\n\n${next}\nFor therapy services we will contact you to schedule.${footerText()}`,
  };
}
