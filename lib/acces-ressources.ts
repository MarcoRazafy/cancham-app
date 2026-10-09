import "server-only";

import { prisma } from "@/lib/db";
import { isAccessLocked } from "@/lib/membership";
import { dossiersInterdits, getMember } from "@/lib/queries";
import { utilisateurConnecte } from "@/lib/session";

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
    select: {
      id: true,
      titre: true,
      fichier: true,
      pages: true,
      type: true,
      fmt: true,
      dossierId: true,
    },
  });
  if (!r || (!r.fichier && r.fmt !== "page")) {
    return { ok: false, statut: 404, message: "Ressource introuvable." };
  }

  if (r.dossierId && (await dossiersInterdits(user)).includes(r.dossierId)) {
    return { ok: false, statut: 404, message: "Ressource introuvable." };
  }

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
    ressource: {
      id: r.id,
      titre: r.titre,
      fichier: r.fichier ?? "",
      pages: r.pages,
    },
  };
}

export const ENTETES_PROTEGES = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Disposition": "inline",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Robots-Tag": "noindex, nofollow",
} as const;
