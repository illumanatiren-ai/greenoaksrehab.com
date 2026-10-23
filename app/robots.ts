import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/cart", "/checkout", "/order-complete", "/unsubscribe", "/subscribe/"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
