import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://lightbooker.com";

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

const SEO_ROUTES = [
  // ✅ Pages SEO principales
  "/location-paris",
  "/location-marseille",
  "/location-toulouse",
  "/location-guyane",
  "/location-martinique",

  // ✅ Cluster Paris (trafic)
  "/location-appartement-paris",
  "/location-courte-duree-paris",
  "/location-meublee-paris",
  "/location-weekend-paris",
  "/location-studio-paris",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 1,
    },

    {
      url: `${SITE_URL}/villes`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },

    // ✅ Pages SEO
    ...SEO_ROUTES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "/location-paris" ? 0.9 : 0.8,
    })),

    // Pages statiques
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/cgv`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/cgu`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
  ];

  const cityRoutes: MetadataRoute.Sitemap = CITY_SLUGS.map((slug) => ({
    url: `${SITE_URL}/villes/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...cityRoutes];
}