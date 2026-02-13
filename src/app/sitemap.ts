// FILE: src/app/sitemap.ts
import type { MetadataRoute } from "next";

const RAW_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lightbooker.com";
const SITE_URL = RAW_SITE_URL.replace(/\/+$/, ""); // enlève les "/" à la fin

const CITY_SLUGS = [
  // 🇫🇷 Métropole
  "paris",
  "lyon",
  "marseille",
  "toulouse",
  "bordeaux",
  "lille",
  "nantes",
  "nice",
  "montpellier",
  "strasbourg",

  // 🌴 Outre-mer
  "guadeloupe",
  "martinique",
  "guyane",
];

const SEO_SLUGS = [
  // ✅ Pages SEO principales
  "location-paris",
  "location-marseille",
  "location-toulouse",
  "location-guyane",
  "location-martinique",

  // ✅ Cluster Paris (trafic)
  "location-appartement-paris",
  "location-courte-duree-paris",
  "location-meublee-paris",
  "location-weekend-paris",
  "location-studio-paris",
  "location-airbnb-paris",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [];

  // Home
  routes.push({
    url: `${SITE_URL}/`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 1,
  });

  // Index villes
  routes.push({
    url: `${SITE_URL}/villes`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  });

  // Pages SEO
  for (const slug of SEO_SLUGS) {
    routes.push({
      url: `${SITE_URL}/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: slug === "location-paris" ? 0.9 : 0.8,
    });
  }

  // Pages statiques
  routes.push(
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/cgv`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/cgu`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 }
  );

  // Villes dynamiques
  for (const city of CITY_SLUGS) {
    routes.push({
      url: `${SITE_URL}/villes/${city}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return routes;
}