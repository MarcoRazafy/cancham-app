"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { redirectWithFlash } from "@/lib/flash";
import { getCurrentUser } from "@/lib/session";
import { ImageRefusee, enregistrerImage } from "@/lib/uploads";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/**
 * Profil de la personne de l'équipe connectée : nom, fonction, coordonnées,
 * photo. C'est sous ce nom qu'elle apparaît dans la messagerie et au journal
 * d'activité.
 */
export async function modifierProfilEquipe(formData: FormData) {
  const retour = "/admin/profil";
  const user = await getCurrentUser("admin");

  const nom = texte(formData, "nom");
  const fonction = texte(formData, "fonction");
  const email = texte(formData, "email").toLowerCase();
  const tel = texte(formData, "tel") || null;

  if (!nom || !fonction) {
    redirectWithFlash(retour, "Le nom et la fonction sont obligatoires.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirectWithFlash(retour, "Indiquez une adresse e-mail valide.");
  }
  // L'adresse servira d'identifiant de connexion : elle est unique.
  const pris = await prisma.user.findFirst({
    where: { email, id: { not: user.id } },
    select: { id: true },
  });
  if (pris) {
    redirectWithFlash(
      retour,
      `${email} est déjà utilisée par un autre compte.`,
    );
  }

  let photo: string | null = null;
  try {
    photo = await enregistrerImage(formData.get("photo"), {
      prefixe: `equipe-${user.id}`,
      largeur: 480,
    });
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithFlash(retour, e.message);
    throw e;
  }
  const retirerPhoto = texte(formData, "retirerPhoto") === "1";

  await prisma.user.update({
    where: { id: user.id },
    data: {
      nom,
      fonction,
      email,
      tel,
      ...(photo ? { photo } : retirerPhoto ? { photo: null } : {}),
    },
  });

  revalidatePath("/", "layout");
  redirectWithFlash(retour, "Profil mis à jour");
}
