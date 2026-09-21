import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/about",
    "/how-it-works",
    "/portfolio",
    "/submit",
    "/for-founders",
    "/for-businesses",
    "/services",
    "/insights",
    "/opportunities",
    "/contact",
    "/privacy",
    "/terms",
    "/cookies",
  ];
  return routes.map((route) => ({
    url: `${site.url}${route}`,
    lastModified: new Date(),
  }));
}
