import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getActualitesPubliques, getProchainsEvenements } from "@/lib/queries";
import { baseSite } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();

  const base = baseSite();
  const [actualites, evenements] = await Promise.all([
    getActualitesPubliques(100),
    getProchainsEvenements(100),
  ]);

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/auth/inscription`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { url: `${base}/la-traversee`, changeFrequency: "weekly", priority: 0.9 },
    ...evenements.map((e) => ({
      url: `${base}/evenements/${e.id}`,
      lastModified: new Date(e.date),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...actualites.map((a) => ({
      url: `${base}/actualites/${a.id}`,
      lastModified: new Date(a.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
