import "server-only";

import { prisma } from "@/lib/db";
import { jourBase } from "@/lib/format";

/**
 * Présences aux événements : fin d'un événement et absents automatiques.
 *
 * Une fois l'événement terminé — sa date et son heure de fin passées —,
 * toute personne encore « inscrite » n'est pas venue : elle passe « absente »
 * d'elle-même. Rien à pointer à la main après coup ; les présents, eux, ont
 * été pointés à l'entrée, par le scanner ou le bouton « Présent ».
 */

/** Fuseau de la chambre : Antananarivo, UTC+3, sans heure d'été. */
const FUSEAU = "+03:00";

/** Instant présent, `CANCHAM_TODAY` compris (date imposée, heure réelle). */
export function maintenant(): number {
  const impose = process.env.CANCHAM_TODAY;
  if (!impose) return Date.now();
  const heure = new Date().toLocaleTimeString("fr-FR", {
    timeZone: "Indian/Antananarivo",
    hour: "2-digit",
    minute: "2-digit",
  });
  return Date.parse(`${impose}T${heure}:00${FUSEAU}`);
}

/**
 * Fin d'un événement : sa date à l'heure de fin, ou à 23 h 59 quand l'heure
 * de fin n'est pas donnée.
 */
export function finEvenement(e: {
  /** Date de l'événement : celle de la base, ou déjà en ISO court. */
  date: Date | string;
  fin: string | null;
}): number {
  const jour =
    typeof e.date === "string"
      ? e.date.slice(0, 10)
      : e.date.toISOString().slice(0, 10);
  return Date.parse(`${jour}T${e.fin ?? "23:59"}:00${FUSEAU}`);
}

export function estTermine(e: {
  date: Date | string;
  fin: string | null;
}): boolean {
  return finEvenement(e) <= maintenant();
}

/**
 * Passe « absentes » les personnes encore inscrites aux événements terminés
 * — à un seul, ou à tous. Appelée à la lecture des listes d'accueil : il n'y
 * a pas de tâche planifiée, et la liste est juste dès qu'on la regarde.
 */
export async function marquerAbsentsPasses(eventId?: string): Promise<void> {
  const candidats = await prisma.event.findMany({
    where: {
      ...(eventId ? { id: eventId } : {}),
      date: { lte: jourBase() },
      participants: { some: { statut: "confirme" } },
    },
    select: { id: true, date: true, fin: true },
  });
  const termines = candidats.filter(estTermine).map((e) => e.id);
  if (!termines.length) return;
  await prisma.attendee.updateMany({
    where: { eventId: { in: termines }, statut: "confirme" },
    data: { statut: "absent" },
  });
}
