"use server";

import { revalidatePath } from "next/cache";
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
