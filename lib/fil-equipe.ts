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
  if (existant) {
    // Les comptes d'équipe ouverts depuis rejoignent la conversation : une
    // demande arrive à toute l'équipe, pas à celle du jour de sa création.
    await rattacherEquipe(existant.id);
    return existant.id;
  }

  const equipe = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true },
  });
  const fil = await prisma.messageThread.create({
    data: {
      type: "individuel",
      equipe: true,
      nom: "Équipe CanCham",
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
 * Rattache toute l'équipe aux fils d'assistance — un seul, ou tous.
 *
 * Un compte d'équipe ouvert après la création d'un fil n'en serait pas, et
 * la demande du membre lui échapperait. Appelée quand un membre écrit, et à
 * l'ouverture d'un compte d'équipe.
 */
export async function rattacherEquipe(threadId?: string): Promise<void> {
  const [equipe, fils] = await Promise.all([
    prisma.user.findMany({ where: { role: "admin" }, select: { id: true } }),
    prisma.messageThread.findMany({
      where: { equipe: true, ...(threadId ? { id: threadId } : {}) },
      select: { id: true, participants: { select: { userId: true } } },
    }),
  ]);
  const manquants = fils.flatMap((f) => {
    const deja = new Set(f.participants.map((p) => p.userId));
    return equipe
      .filter((a) => !deja.has(a.id))
      .map((a) => ({ threadId: f.id, userId: a.id }));
  });
  if (manquants.length) {
    await prisma.participantFil.createMany({
      data: manquants,
      skipDuplicates: true,
    });
  }
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
