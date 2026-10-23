import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/services", "/shop", "/about", "/contact", "/privacy", "/terms", "/cookies"].map((p) => ({
    url: `${siteUrl}${p}`,
    lastModified: new Date(),
  }));
}
