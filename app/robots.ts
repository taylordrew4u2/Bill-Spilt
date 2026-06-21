import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://billspilt.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Auth-gated app screens and APIs have nothing useful to crawl.
      disallow: ["/api/", "/home", "/expenses", "/settle", "/stats"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
