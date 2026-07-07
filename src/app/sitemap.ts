import type { MetadataRoute } from "next";
import { seoPageList } from "@/lib/seo-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://changeorderkit.com";
  const staticRoutes = ["", "/success", "/privacy", "/terms"];
  const seoRoutes = seoPageList.map((page) => `/${page.slug}`);

  return [...staticRoutes, ...seoRoutes].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date()
  }));
}
