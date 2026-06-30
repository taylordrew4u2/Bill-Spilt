import type { MetadataRoute } from "next";
import { SITE_URL as BASE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Auth-gated app screens, invite links, and APIs have nothing useful to
      // crawl.
      disallow: ["/api/", "/home", "/expenses", "/settle", "/stats", "/join"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
