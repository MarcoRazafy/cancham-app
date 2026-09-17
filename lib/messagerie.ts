import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Règles de la messagerie partagées par les requêtes et les actions.
 */

/**
 * Qui l'on peut ajouter à une conversation : l'équipe CanCham, et les
 * contacts des entreprises dont l'adhésion est active. Une candidature en
 * cours n'ouvre pas encore l'accès à la messagerie.
 */
export function critereJoignable(userId: string): Prisma.UserWhereInput {
  return {
    id: { not: userId },
    OR: [
      { role: "admin" },
      { role: "membre", member: { statut: { in: ["a_jour", "en_retard"] } } },
    ],
  };
}

/** Participants d'un groupe, créateur compris. */
export const MAX_PARTICIPANTS_GROUPE = 50;

/** Conversations qu'un transfert peut viser d'un coup. */
export const MAX_CIBLES_TRANSFERT = 10;

export const LONGUEUR_NOM_GROUPE = 80;
