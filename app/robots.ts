import type { MetadataRoute } from "next";
import { baseSite } from "@/lib/site";

/**
 * Ce que les moteurs ont le droit de parcourir.
 *
 * La vitrine, oui — c'est son métier. La plateforme, non : ses pages
 * demandent une session, un robot n'y trouverait qu'un écran de connexion, et
 * l'adresse d'un billet ou d'une facture n'a rien à faire dans un index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // La demande d'adhésion est une porte d'entrée : elle s'indexe, à la
      // différence du reste de `/auth`, qui n'est qu'un écran de connexion.
      allow: ["/", "/auth/inscription"],
      disallow: ["/membre/", "/admin/", "/auth/", "/api/", "/televersements/"],
    },
    sitemap: `${baseSite()}/sitemap.xml`,
  };
}
