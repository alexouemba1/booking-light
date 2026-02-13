import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const SITE_URL = "https://lightbooker.com";
  const now = new Date();

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

  return [
    { url: `${SITE_URL}/`, lastModified: now },
    { url: `${SITE_URL}/villes`, lastModified: now },

    ...SEO_ROUTES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
    })),

    ...CITY_SLUGS.map((slug) => ({
      url: `${SITE_URL}/villes/${slug}`,
      lastModified: now,
    })),
  ];
}