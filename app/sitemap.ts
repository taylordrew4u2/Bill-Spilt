import type { MetadataRoute } from "next";
import { SITE_URL as BASE } from "@/lib/site";
import { GUIDES, guidePath } from "@/lib/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const guides: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${BASE}${guidePath(g.slug)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${BASE}/split-calculator`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...guides,
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
