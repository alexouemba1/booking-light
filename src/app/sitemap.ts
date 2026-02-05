// FILE: src/app/sitemap.ts
import type { MetadataRoute } from "next";

const SITE_URL = "https://lightbooker.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    // 🏠 Home — page la plus importante
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },

    // 📢 Pages clés
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },

    // 📜 Légal
    {
      url: `${SITE_URL}/cgv`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/cgu`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}