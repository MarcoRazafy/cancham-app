"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { redirectWithFlash } from "@/lib/flash";
import { getCurrentUser } from "@/lib/session";
import type { Space } from "@/lib/types";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Envoi d'un message dans un fil. */
export async function sendMessage(formData: FormData) {
  const threadId = texte(formData, "threadId");
  const space = (texte(formData, "space") || "membre") as Space;
  const contenu = texte(formData, "texte");
  const retour = `/${space}/messagerie?t=${threadId}`;

  if (!contenu) redirectWithFlash(retour, "Le message est vide.");

  const user = await getCurrentUser(space);

  await prisma.message.create({
    data: {
      threadId,
      auteur: user.nom,
      texte: contenu,
      sentAt: new Date(),
      userId: user.id,
    },
  });

  // Ouvrir un fil pour y répondre vaut lecture.
  await prisma.messageThread.update({
    where: { id: threadId },
    data: { unread: 0 },
  });

  revalidatePath("/", "layout");
  redirectWithFlash(retour, "Message envoyé");
}

/** Marque un fil comme lu à son ouverture. */
export async function markThreadRead(threadId: string) {
  await prisma.messageThread.updateMany({
    where: { id: threadId, unread: { gt: 0 } },
    data: { unread: 0 },
  });
  revalidatePath("/", "layout");
}

/**
 * Ouvre la conversation avec une entreprise depuis sa fiche d'annuaire.
 *
 * Si un fil existe déjà avec ce membre, on y retourne. Sans ce garde-fou, la
 * messagerie se remplirait d'un fil par clic sur le bouton, tous avec le même
 * interlocuteur et chacun avec un bout de l'historique.
 *
 * Le fil prend l'identité du contact principal : c'est la personne que la
 * chambre désigne comme référente, donc celle qui répondra.
 */
export async function ouvrirConversation(formData: FormData) {
  const memberId = texte(formData, "memberId");
  const space = (texte(formData, "space") || "membre") as Space;

  const existant = await prisma.messageThread.findFirst({
    where: { memberId, type: "individuel" },
    orderBy: { createdAt: "asc" },
  });
  if (existant) redirect(`/${space}/messagerie?t=${existant.id}`);

  const membre = await prisma.member.findUnique({
    where: { id: memberId },
    select: { nom: true },
  });
  if (!membre) redirectWithFlash(`/${space}/annuaire`, "Entreprise introuvable.");

  const referent = await prisma.user.findFirst({
    where: { memberId },
    orderBy: [{ contactPrincipal: "desc" }, { createdAt: "asc" }],
  });

  const nom = referent?.nom ?? membre.nom;
  const fil = await prisma.messageThread.create({
    data: {
      type: "individuel",
      memberId,
      nom,
      sousTitre: referent
        ? `${membre.nom} · ${referent.fonction}`
        : membre.nom,
      init: initiales(nom),
      avatar: referent?.photo ?? null,
      unread: 0,
    },
  });

  revalidatePath("/", "layout");
  redirect(`/${space}/messagerie?t=${fil.id}`);
}

function initiales(nom: string): string {
  return nom
    .split(/\s+/)
    .map((mot) => mot[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
