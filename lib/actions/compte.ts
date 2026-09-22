"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { fermerSession, verifier } from "@/lib/auth";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";
import { minutes, oublier, tentative } from "@/lib/limite";
import { getCurrentUser } from "@/lib/session";

/**
 * Suppression de son propre compte, depuis son profil.
 *
 * Elle est définitive : le compte disparaît, avec ses commentaires, ses
 * « j'aime » et ses rappels. Ce qui appartient à la chambre reste — les
 * messages échangés, les traces du journal, la fiche de l'entreprise et ses
 * factures —, sinon l'historique de la chambre partirait avec un départ.
 *
 * Deux garde-fous : une entreprise garde au moins un contact, et la
 * plateforme au moins un administrateur. Le mot de passe est redemandé : une
 * session laissée ouverte sur un poste partagé ne doit pas suffire à
 * supprimer un compte.
 */

/** Essais du mot de passe tolérés par quart d'heure. */
const ESSAIS = 5;

export async function supprimerMonCompte(formData: FormData) {
  const equipe = String(formData.get("espace") ?? "") === "admin";
  const retour = equipe ? "/admin/profil" : "/membre/profil";
  const user = await getCurrentUser(equipe ? "admin" : "membre");
  const erreur = (message: string): never =>
    redirectWithErreur(retour, message);

  const cle = `suppression-compte:${user.id}`;
  const attente = tentative(cle, ESSAIS, 15 * 60 * 1000);
  if (attente) {
    erreur(
      `Trop d’essais. Réessayez dans ${minutes(attente)} minute${minutes(attente) > 1 ? "s" : ""}.`,
    );
  }

  const compte = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      email: true,
      motDePasse: true,
      memberId: true,
      niveauEquipe: true,
      member: { select: { nom: true } },
    },
  });
  if (!verifier(String(formData.get("motDePasse") ?? ""), compte.motDePasse)) {
    erreur(
      "Le mot de passe n’est pas le bon : le compte n’a pas été supprimé.",
    );
  }
  oublier(cle);

  // Une entreprise sans contact ne serait plus joignable, et son accès ne
  // pourrait plus être rouvert.
  if (compte.memberId) {
    const contacts = await prisma.user.count({
      where: { memberId: compte.memberId, role: "membre" },
    });
    if (contacts <= 1) {
      erreur(
        `Vous êtes le seul contact de ${compte.member?.nom ?? "votre entreprise"} : ajoutez un collègue avant de partir, ou demandez à l’équipe CanCham de retirer la fiche.`,
      );
    }
  }

  // Le dernier administrateur ne part pas : plus personne ne pourrait ouvrir
  // d'accès ni gérer l'équipe.
  if (user.role === "admin" && compte.niveauEquipe === "administrateur") {
    const restants = await prisma.user.count({
      where: { role: "admin", niveauEquipe: "administrateur" },
    });
    if (restants <= 1) {
      erreur(
        "Vous êtes le dernier administrateur : nommez-en un autre depuis « Équipe & accès » avant de supprimer votre compte.",
      );
    }
  }

  await prisma.$transaction([
    prisma.auditLog.create({
      data: {
        action: "compte_supprime",
        entite: compte.memberId ? "Member" : "User",
        entiteId: compte.memberId ?? user.id,
        acteur: user.nom,
        detail: `${user.nom} (${compte.email}) a supprimé son compte${
          compte.member ? ` · ${compte.member.nom}` : " · équipe CanCham"
        }.`,
      },
    }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  await fermerSession();
  revalidatePath("/", "layout");
  redirectWithFlash(
    "/auth",
    "Votre compte a été supprimé. Merci d’avoir fait partie du réseau CanCham.",
  );
}
