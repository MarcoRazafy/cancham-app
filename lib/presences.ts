import "server-only";

import { prisma } from "@/lib/db";
import { jourBase } from "@/lib/format";

const FUSEAU = "+03:00";

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

export function finEvenement(e: {
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

export async function marquerAbsentsPasses(eventId?: string): Promise<void> {
  const candidats = await prisma.event.findMany({
    where: {
      ...(eventId ? { id: eventId } : {}),
      date: { lte: jourBase() },
      participants: { some: { statut: { in: ["a_valider", "confirme"] } } },
    },
    select: { id: true, date: true, fin: true },
  });
  const termines = candidats.filter(estTermine).map((e) => e.id);
  if (!termines.length) return;
  await prisma.attendee.updateMany({
    where: {
      eventId: { in: termines },
      statut: { in: ["a_valider", "confirme"] },
    },
    data: { statut: "absent" },
  });
}
