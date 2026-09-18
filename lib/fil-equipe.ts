import "server-only";

import { prisma } from "@/lib/db";

/**
 * Fil d'assistance d'un membre avec l'équipe CanCham : celui qu'il a déjà, ou
 * un nouveau.
 *
 * Toute l'équipe y participe — la demande ne dépend pas de la personne de
 * permanence —, et le membre y voit la chambre plutôt qu'un interlocuteur.
 * Page de contact et réservation de service y écrivent au même endroit.
 */
export async function filEquipe(userId: string): Promise<string> {
  const existant = await prisma.messageThread.findFirst({
    where: { equipe: true, participants: { some: { userId } } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (existant) return existant.id;

  const equipe = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true },
  });
  const fil = await prisma.messageThread.create({
    data: {
      type: "individuel",
      equipe: true,
      nom: "Équipe CanCham",
      avatar: "/photos/cancham-13.jpg",
      participants: {
        create: [
          { userId, luLe: new Date() },
          ...equipe.map((a) => ({ userId: a.id })),
        ],
      },
    },
    select: { id: true },
  });
  return fil.id;
}

/**
 * Écrit dans le fil de l'équipe au nom du membre, et marque le fil lu de son
 * côté : c'est lui qui vient d'écrire.
 */
export async function ecrireAEquipe(
  user: { id: string; nom: string },
  texte: string,
): Promise<string> {
  const threadId = await filEquipe(user.id);
  const maintenant = new Date();
  await prisma.message.create({
    data: {
      threadId,
      auteur: user.nom,
      userId: user.id,
      sentAt: maintenant,
      texte,
    },
  });
  await prisma.participantFil.updateMany({
    where: { threadId, userId: user.id },
    data: { luLe: maintenant },
  });
  return threadId;
}
