import "server-only";

import { prisma } from "@/lib/db";

export type EtatAcces = "actif" | "invite" | "a_envoyer" | "sans_contact";

export interface AccesMembre {
  etat: EtatAcces;
  contact: { id: string; nom: string; email: string } | null;
  inviteLe: string | null;
}

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
