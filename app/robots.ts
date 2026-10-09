import type { MetadataRoute } from "next";
import { baseSite } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/auth/inscription"],
      disallow: ["/membre/", "/admin/", "/auth/", "/api/", "/televersements/"],
    },
    sitemap: `${baseSite()}/sitemap.xml`,
  };
}
