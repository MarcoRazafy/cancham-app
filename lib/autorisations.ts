import "server-only";

import { prisma } from "@/lib/db";
import { redirectWithErreur } from "@/lib/flash";
import { getCurrentUser } from "@/lib/session";
import type { User } from "@/lib/types";

/**
 * Qui a le droit de faire quoi, en un seul endroit.
 *
 * Une action serveur est une adresse publique : le proxy protège les pages,
 * pas les actions, et rien n'empêche d'en appeler une depuis une autre page
 * que celle où vit son formulaire. Chaque action commence donc par dire qui
 * elle attend — et, quand elle reçoit l'identifiant d'une fiche, vérifie
 * qu'il appartient bien à la personne qui appelle.
 *
 * Les identifiants venus du formulaire ne sont jamais crus sur parole : pour
 * un membre, c'est son entreprise qui fait foi.
 */

const REFUS = "Vous n’avez pas accès à cette fiche.";

/** Réservé à l'équipe. Renvoie la personne qui agit, pour le journal. */
export async function exigerEquipe(): Promise<User> {
  return getCurrentUser("admin");
}

export interface AccesFiche {
  user: User;
  /** L'entreprise sur laquelle porte l'action. */
  memberId: string;
  /** Vrai quand l'action vient du back-office. */
  estEquipe: boolean;
}

/**
 * Action sur la fiche d'une entreprise : l'équipe agit sur n'importe
 * laquelle, un membre sur la sienne seulement. L'identifiant reçu est
 * ignoré pour un membre : c'est celui de son compte qui compte.
 */
export async function exigerFiche(
  memberIdDemande: string,
  retour = "/membre/profil",
): Promise<AccesFiche> {
  const equipe = retour.startsWith("/admin");
  const user = await getCurrentUser(equipe ? "admin" : "membre");

  if (user.role === "admin") {
    if (!memberIdDemande) redirectWithErreur(retour, "Fiche introuvable.");
    return { user, memberId: memberIdDemande, estEquipe: true };
  }
  if (!user.memberId) redirectWithErreur(retour, REFUS);
  if (memberIdDemande && memberIdDemande !== user.memberId) {
    redirectWithErreur(retour, REFUS);
  }
  return { user, memberId: user.memberId, estEquipe: false };
}

/** Action sur un produit ou service : il doit appartenir à la fiche autorisée. */
export async function exigerProduit(
  produitId: string,
  retour = "/membre/profil",
): Promise<{ user: User; memberId: string; estEquipe: boolean }> {
  const produit = await prisma.produit.findUnique({
    where: { id: produitId },
    select: { memberId: true },
  });
  if (!produit) redirectWithErreur(retour, "Offre introuvable.");
  return exigerFiche(produit.memberId, retour);
}

/** Action sur un contact : il doit être rattaché à la fiche autorisée. */
export async function exigerContact(
  contactId: string,
  retour = "/membre/profil",
): Promise<{ user: User; memberId: string; estEquipe: boolean }> {
  const contact = await prisma.user.findUnique({
    where: { id: contactId },
    select: { memberId: true },
  });
  if (!contact?.memberId) redirectWithErreur(retour, "Contact introuvable.");
  return exigerFiche(contact.memberId, retour);
}
