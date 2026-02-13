// FILE: src/app/sitemap.ts
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lightbooker.com";

const CITY_SLUGS = [
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
  "guadeloupe",
  "martinique",
  "guyane",
];

const SEO_ROUTES = [
  "/location-paris",
  "/location-marseille",
  "/location-toulouse",
  "/location-guyane",
  "/location-martinique",

  "/location-appartement-paris",
  "/location-courte-duree-paris",
  "/location-meublee-paris",
  "/location-weekend-paris",
  "/location-studio-paris",
  "/location-airbnb-paris",
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
  SEO_ROUTES.forEach((path) => {
    routes.push({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: path === "/location-paris" ? 0.9 : 0.8,
    });
  });

  // Pages statiques
  routes.push(
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
    }
  );

  // Pages villes dynamiques
  CITY_SLUGS.forEach((slug) => {
    routes.push({
      url: `${SITE_URL}/villes/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  });

  return routes;
}