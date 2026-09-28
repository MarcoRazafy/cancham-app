import "server-only";

import { prisma } from "@/lib/db";
import { isAccessLocked } from "@/lib/membership";
import { getMember } from "@/lib/queries";
import { utilisateurConnecte } from "@/lib/session";

/**
 * Qui peut lire une ressource, et à quelles conditions.
 *
 * Contrôle rejoué à chaque page et à chaque morceau de vidéo servi : les
 * routes de `/api` échappent au verrou de `proxy.ts`, qui ne surveille que
 * `/membre`. Sans cette vérification, il suffirait de connaître l'URL d'une
 * page pour la récupérer, adhésion à jour ou non.
 *
 * L'équipe lit tout, gratuit comme payant : la bibliothèque est la sienne, et
 * elle doit pouvoir relire ce qu'elle publie avant les membres.
 */
export type Acces =
  | {
      ok: true;
      ressource: {
        id: string;
        titre: string;
        fichier: string;
        pages: number | null;
      };
    }
  | { ok: false; statut: 403 | 404; message: string };

export async function verifierAcces(id: string): Promise<Acces> {
  const user = await utilisateurConnecte();
  const equipe = user?.role === "admin";
  const refus: Acces = {
    ok: false,
    statut: 403,
    message: "Accès réservé aux membres à jour de cotisation.",
  };
  if (!user) return refus;

  if (!equipe) {
    const membre = user.memberId ? await getMember(user.memberId) : null;
    if (!membre || isAccessLocked(membre)) return refus;
  }

  const r = await prisma.resource.findUnique({
    where: { id },
    select: { id: true, titre: true, fichier: true, pages: true, type: true },
  });
  if (!r?.fichier) {
    return { ok: false, statut: 404, message: "Ressource introuvable." };
  }

  // Une ressource facturée ne s'ouvre qu'aux entreprises à qui l'équipe l'a
  // ouverte. L'accès est donné à l'entreprise, pas à la personne : la
  // cotisation est celle de l'entreprise, et ses collaborateurs travaillent
  // sur les mêmes documents.
  if (r.type === "payant" && !equipe) {
    const ouvert = user.memberId
      ? await prisma.accesRessource.count({
          where: { resourceId: r.id, memberId: user.memberId },
        })
      : 0;
    if (!ouvert) {
      return {
        ok: false,
        statut: 403,
        message: "Ressource payante : accès après achat.",
      };
    }
  }

  return {
    ok: true,
    ressource: { id: r.id, titre: r.titre, fichier: r.fichier, pages: r.pages },
  };
}

/**
 * En-têtes de toute réponse de contenu protégé.
 *
 * `no-store` : rien ne reste dans le cache du navigateur ni d'un proxy.
 * `inline` : le navigateur affiche, il ne propose pas d'enregistrer.
 * `same-origin` : une autre page ne peut pas embarquer le contenu.
 */
export const ENTETES_PROTEGES = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Disposition": "inline",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Robots-Tag": "noindex, nofollow",
} as const;
