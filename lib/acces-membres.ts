import "server-only";

import { prisma } from "@/lib/db";

/**
 * Où en est l'accès d'un membre à la plateforme.
 *
 * Personne ne choisit de mot de passe en s'inscrivant, ni en étant inscrit
 * par l'équipe : c'est l'équipe qui ouvre l'accès, d'un clic sur
 * « Envoyer l’accès ». Le contact principal reçoit alors un lien pour créer
 * son mot de passe. On lit ici l'étape où chacun se trouve.
 */
export type EtatAcces =
  /** Le contact a son mot de passe : il se connecte. */
  | "actif"
  /** Le lien est parti et vaut encore : on attend qu'il s'en serve. */
  | "invite"
  /** Rien n'est parti, ou le lien a expiré : l'équipe doit cliquer. */
  | "a_envoyer"
  /** Aucun contact rattaché : personne à qui écrire. */
  | "sans_contact";

export interface AccesMembre {
  etat: EtatAcces;
  contact: { id: string; nom: string; email: string } | null;
  /** Date du dernier lien encore valable, ISO court. */
  inviteLe: string | null;
}

/** L'accès de chaque membre demandé, lu en une requête pour la liste entière. */
export async function getAccesMembres(
  memberIds: string[],
): Promise<Record<string, AccesMembre>> {
  const contacts = await prisma.user.findMany({
    where: { memberId: { in: memberIds }, role: "membre" },
    orderBy: [{ contactPrincipal: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      nom: true,
      email: true,
      memberId: true,
      motDePasse: true,
      jetons: {
        where: {
          usage: "invitation",
          utiliseLe: null,
          expire: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  const acces: Record<string, AccesMembre> = {};
  for (const id of memberIds) {
    acces[id] = { etat: "sans_contact", contact: null, inviteLe: null };
  }
  for (const c of contacts) {
    // Le premier de chaque entreprise est son contact principal.
    if (!c.memberId || acces[c.memberId].contact) continue;
    const invitation = c.jetons[0]?.createdAt ?? null;
    acces[c.memberId] = {
      etat: c.motDePasse ? "actif" : invitation ? "invite" : "a_envoyer",
      contact: { id: c.id, nom: c.nom, email: c.email },
      inviteLe: invitation ? invitation.toISOString().slice(0, 10) : null,
    };
  }
  return acces;
}

export async function getAccesMembre(memberId: string): Promise<AccesMembre> {
  return (await getAccesMembres([memberId]))[memberId];
}
