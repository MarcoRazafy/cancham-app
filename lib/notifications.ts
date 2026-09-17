import "server-only";

import { prisma } from "@/lib/db";
import { getUnreadTotal } from "@/lib/queries";
import { toISODate } from "@/lib/enums";
import { fmtDate } from "@/lib/format";
import {
  ADHESION_PENDING,
  joursDeRetard,
  retardBloque,
  RETARD_BLOCAGE_JOURS,
} from "@/lib/membership";
import type { Space } from "@/lib/types";

export interface Notification {
  id: string;
  titre: string;
  temps: string;
  href: string;
  /** Sévérité, pour la pastille de couleur. */
  ton: "info" | "warn" | "bad";
}

/**
 * Notifications de la barre supérieure.
 *
 * Elles sont recalculées à chaque affichage à partir de l'état réel de la base :
 * aucune table de notifications à tenir à jour, donc rien qui puisse se
 * désynchroniser. En contrepartie, elles ne se « marquent pas comme lues » —
 * elles disparaissent quand la situation qui les motive est réglée.
 */
export async function getNotifications(
  space: Space,
  memberId: string | null,
  /** Les messages non lus sont ceux de l'utilisateur, pas de l'espace. */
  userId: string,
): Promise<Notification[]> {
  return space === "admin"
    ? notificationsAdmin(userId)
    : notificationsMembre(memberId, userId);
}

async function notificationsAdmin(userId: string): Promise<Notification[]> {
  const [parStatut, nonLus, prochain] = await Promise.all([
    prisma.member.groupBy({ by: ["statut"], _count: { _all: true } }),
    getUnreadTotal(userId),
    prisma.event.findFirst({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
      select: { titre: true, date: true },
    }),
  ]);

  const compte = (s: string) =>
    parStatut.find((r) => r.statut === s)?._count._all ?? 0;

  const liste: Notification[] = [];

  const candidatures = compte("candidature");
  if (candidatures)
    liste.push({
      id: "candidatures",
      titre: `${candidatures} demande${candidatures > 1 ? "s" : ""} d’adhésion à examiner`,
      temps: "À traiter",
      href: "/admin/membres?tab=candidature",
      ton: "warn",
    });

  const enRetard = compte("en_retard");
  if (enRetard)
    liste.push({
      id: "retard",
      titre: `${enRetard} cotisation${enRetard > 1 ? "s" : ""} en retard`,
      temps: "À relancer",
      href: "/admin/membres?tab=en_retard",
      ton: "bad",
    });

  const enAttente = compte("en_attente");
  if (enAttente)
    liste.push({
      id: "attente",
      titre: `${enAttente} adhésion${enAttente > 1 ? "s" : ""} en attente de paiement`,
      temps: "À encaisser",
      href: "/admin/membres?tab=en_attente",
      ton: "warn",
    });

  const messages = nonLus;
  if (messages)
    liste.push({
      id: "messages",
      titre: `${messages} message${messages > 1 ? "s" : ""} non lu${messages > 1 ? "s" : ""}`,
      temps: "Messagerie",
      href: "/admin/messagerie",
      ton: "info",
    });

  if (prochain)
    liste.push({
      id: "prochain",
      titre: `Prochain événement : ${prochain.titre}`,
      temps: fmtDate(toISODate(prochain.date), {
        day: "numeric",
        month: "short",
      }),
      href: "/admin/evenements",
      ton: "info",
    });

  return liste;
}

async function notificationsMembre(
  memberId: string | null,
  userId: string,
): Promise<Notification[]> {
  if (!memberId) return [];

  const [membre, nonLus, inscription, offre, actualite] = await Promise.all([
    prisma.member.findUnique({
      where: { id: memberId },
      select: { statut: true, retardDepuis: true },
    }),
    getUnreadTotal(userId),
    prisma.registration.findFirst({
      where: { memberId, event: { date: { gte: new Date() } } },
      orderBy: { event: { date: "asc" } },
      select: { event: { select: { id: true, titre: true, date: true } } },
    }),
    prisma.offer.findFirst({
      orderBy: { createdAt: "desc" },
      select: { titre: true },
    }),
    prisma.news.findFirst({
      orderBy: { date: "desc" },
      select: { id: true, titre: true, date: true },
    }),
  ]);

  const liste: Notification[] = [];

  if (membre) {
    const vue = {
      statut: membre.statut,
      retardDepuis: membre.retardDepuis ? toISODate(membre.retardDepuis) : null,
    } as Parameters<typeof joursDeRetard>[0];

    if (ADHESION_PENDING.includes(membre.statut))
      liste.push({
        id: "cotisation",
        titre: "Cotisation à régler pour activer votre accès complet",
        temps: "À traiter",
        href: "/membre/profil",
        ton: "warn",
      });
    else if (membre.statut === "en_retard")
      liste.push({
        id: "retard",
        titre: retardBloque(vue)
          ? `Accès restreint — ${joursDeRetard(vue)} jours de retard`
          : `Cotisation en retard — ${joursDeRetard(vue)}/${RETARD_BLOCAGE_JOURS} jours écoulés`,
        temps: "À régulariser",
        href: "/membre/profil",
        ton: "bad",
      });
  }

  const messages = nonLus;
  if (messages)
    liste.push({
      id: "messages",
      titre: `${messages} message${messages > 1 ? "s" : ""} non lu${messages > 1 ? "s" : ""}`,
      temps: "Messagerie",
      href: "/membre/messagerie",
      ton: "info",
    });

  if (inscription)
    liste.push({
      id: "inscription",
      titre: `Inscription confirmée : ${inscription.event.titre}`,
      temps: fmtDate(toISODate(inscription.event.date), {
        day: "numeric",
        month: "short",
      }),
      href: `/membre/evenements/${inscription.event.id}`,
      ton: "info",
    });

  if (offre)
    liste.push({
      id: "offre",
      titre: `Offre membre : ${offre.titre}`,
      temps: "Cette semaine",
      href: "/membre/actualites",
      ton: "info",
    });

  if (actualite)
    liste.push({
      id: "actualite",
      titre: `Actualité : ${actualite.titre}`,
      temps: fmtDate(toISODate(actualite.date), {
        day: "numeric",
        month: "short",
      }),
      href: `/membre/actualites/${actualite.id}`,
      ton: "info",
    });

  return liste.slice(0, 5);
}
