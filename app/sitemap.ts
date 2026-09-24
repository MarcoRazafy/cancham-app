import type { MetadataRoute } from "next";
import { getActualitesPubliques, getProchainsEvenements } from "@/lib/queries";
import { baseSite } from "@/lib/site";

/**
 * Le plan du site : la vitrine et ce qu'elle publie.
 *
 * Seules les pages ouvertes à tous y figurent — un événement ou une actualité
 * réservés à la plateforme n'y paraissent pas, puisque les requêtes ne
 * rendent que ce qui est diffusé publiquement.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
