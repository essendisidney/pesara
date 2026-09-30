import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/about",
    "/partnership",
    "/how-it-works",
    "/portfolio",
    "/submit",
    "/idea-check",
    "/whats-your-idea",
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
