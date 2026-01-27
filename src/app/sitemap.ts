import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://lightbooker.com",
      lastModified: new Date(),
    },
    {
      url: "https://lightbooker.com/about",
      lastModified: new Date(),
    },
    {
      url: "https://lightbooker.com/contact",
      lastModified: new Date(),
    },
    {
      url: "https://lightbooker.com/cgv",
      lastModified: new Date(),
    },
    {
      url: "https://lightbooker.com/cgu",
      lastModified: new Date(),
    },
    {
      url: "https://lightbooker.com/privacy",
      lastModified: new Date(),
    },
  ];
}