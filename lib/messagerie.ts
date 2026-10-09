import type { Prisma } from "@/lib/generated/prisma/client";

export function critereJoignable(userId: string): Prisma.UserWhereInput {
  return {
    id: { not: userId },
    OR: [
      { role: "admin" },
      { role: "membre", member: { statut: { in: ["a_jour", "en_retard"] } } },
    ],
  };
}

export const MAX_PARTICIPANTS_GROUPE = 50;

export const MAX_CIBLES_TRANSFERT = 10;

export const LONGUEUR_NOM_GROUPE = 80;
