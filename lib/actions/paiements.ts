"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";
import { estPortefeuilleConnu } from "@/lib/portefeuilles";
import { referenceReglement } from "@/lib/reglements";
import { getCurrentUser } from "@/lib/session";
import { baseSite } from "@/lib/site";
import {
  mobileMoneyEnLigne,
  ouvrirPaiement,
  vanillaPayActif,
} from "@/lib/vanillapay";

const texte = (fd: FormData, k: string) =>
  String(fd.get(k) ?? "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Où ramener le membre après le paiement.
 *
 * En production, l'adresse publique de la plateforme. En développement,
 * celle d'où il vient : `APP_URL` peut y désigner la plateforme en ligne, et
 * l'y ramener le sortirait de sa base locale. La notification, elle, vise
 * toujours l'adresse publique — le prestataire ne peut joindre que
 * celle-là ; sur un poste de développement, c'est donc la page de retour
 * qui demande l'état du paiement.
 */
async function baseRetour(): Promise<string> {
  if (process.env.NODE_ENV === "production") return baseSite();
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host");
  if (!hote) return baseSite();
  const protocole =
    h.get("x-forwarded-proto") ??
    (/^(localhost|127\.0\.0\.1)(:|$)/.test(hote) ? "http" : "https");
  return `${protocole}://${hote}`;
}

/**
 * Garde la référence de la transaction chez le prestataire, lue sur le lien
 * de paiement : c'est elle qu'on lui présente pour demander où en est le
 * paiement, si sa notification ne nous parvient pas.
 */
async function garderLien(reglementId: string, id: string | null) {
  if (!id) return;
  await prisma.paiement.update({
    where: { id: reglementId },
    data: { transaction: id },
  });
}

/**
 * Le paiement par carte : le membre valide l'écran, et part chez le
 * prestataire saisir sa carte.
 *
 * Une action serveur est une adresse publique : on vérifie donc que le
 * règlement appartient bien à qui paie, qu'il est en carte, pas déjà
 * encaissé, et en Ariary — Vanilla Pay n'encaisse pas le dollar canadien.
 *
 * Le nom du titulaire est gardé avec le règlement : c'est ce que l'équipe
 * regarde le jour où un paiement est contesté. Le numéro de la carte, lui,
 * ne passe jamais par ici — il se saisit chez le prestataire.
 *
 * Chaque tentative prend une référence neuve. Un prestataire refuse souvent
 * de rouvrir une référence déjà envoyée — et c'est elle, et elle seule, qui
 * relie sa notification au bon règlement.
 */
export async function payerParCarte(formData: FormData) {
  const user = await getCurrentUser("membre");
  const id = texte(formData, "reglementId");

  const p = await prisma.paiement.findUnique({
    where: { id },
    include: {
      invoice: { select: { numero: true, objet: true, statut: true } },
    },
  });
  // Même message pour « introuvable » et « pas à vous » : répondre
  // différemment dirait à un curieux quels règlements existent.
  if (!p || !user.memberId || p.memberId !== user.memberId) {
    redirectWithErreur("/membre/cotisations", "Règlement introuvable.");
  }
  const page = `/membre/cotisations/payer/${p.id}`;
  if (p.mode !== "carte") {
    redirectWithErreur(page, "Ce règlement ne se fait pas par carte.");
  }
  if (p.statut === "reussie" || p.invoice?.statut === "payee") {
    redirectWithFlash("/membre/cotisations", "Ce règlement est déjà encaissé.");
  }

  const titulaire = texte(formData, "titulaire").slice(0, 80);
  if (!titulaire) {
    redirectWithErreur(page, "Indiquez le nom du titulaire de la carte.");
  }

  const reference = referenceReglement();
  await prisma.paiement.update({
    where: { id: p.id },
    data: { reference, statut: "en_cours", detail: { titulaire } },
  });

  // Sans les clés du prestataire, la saisie est gardée — le membre n'aura
  // pas à la refaire — mais rien ne part.
  if (!vanillaPayActif()) {
    redirectWithErreur(
      page,
      "Le paiement par carte n’est pas encore raccordé : la chambre attend ses accès au prestataire. En attendant, choisissez un autre moyen.",
    );
  }
  if (p.devise !== "MGA") {
    redirectWithErreur(page, "Le paiement par carte n’accepte que l’Ariary.");
  }

  const base = baseSite();
  const ouverture = await ouvrirPaiement({
    montant: p.montant,
    reference,
    panier: p.invoice?.numero ?? reference,
    mode: "international",
    notifUrl: `${base}/api/paiements/vanillapay`,
    redirectUrl: `${await baseRetour()}/membre/cotisations/retour?ref=${encodeURIComponent(reference)}`,
  });
  // Le règlement reste ouvert : le membre peut réessayer sans tout ressaisir.
  if ("raison" in ouverture) redirectWithErreur(page, ouverture.raison);
  await garderLien(p.id, ouverture.id);

  // Sortie du site : la carte se saisit chez eux, jamais chez nous.
  redirect(ouverture.url);
}

/**
 * Le paiement par portefeuille mobile depuis la plateforme : le membre
 * valide, part chez le prestataire, et son téléphone reçoit la demande de
 * confirmation de l'opérateur. Le code secret ne se saisit que là — jamais
 * chez nous, ni chez le prestataire : sur le téléphone, auprès de
 * l'opérateur. Le débit fait, la notification signée règle la facture, et
 * les billets partent s'il s'agit d'une participation.
 *
 * Mêmes garde-fous que la carte : le règlement doit être à qui paie, en
 * portefeuille, pas déjà encaissé, et en Ariary. Un règlement annoncé à la
 * main peut aussi se payer ici : il repasse « en cours », avec une référence
 * neuve.
 */
export async function payerParPortefeuille(formData: FormData) {
  const user = await getCurrentUser("membre");
  const id = texte(formData, "reglementId");

  const p = await prisma.paiement.findUnique({
    where: { id },
    include: {
      invoice: { select: { numero: true, objet: true, statut: true } },
    },
  });
  if (!p || !user.memberId || p.memberId !== user.memberId) {
    redirectWithErreur("/membre/cotisations", "Règlement introuvable.");
  }
  const page = `/membre/cotisations/payer/${p.id}`;
  if (!estPortefeuilleConnu(p.mode)) {
    redirectWithErreur(page, "Ce règlement ne se fait pas par portefeuille mobile.");
  }
  if (p.statut === "reussie" || p.invoice?.statut === "payee") {
    redirectWithFlash("/membre/cotisations", "Ce règlement est déjà encaissé.");
  }
  if (!mobileMoneyEnLigne()) {
    redirectWithErreur(
      page,
      "Le paiement depuis la plateforme n’est pas encore raccordé pour ce moyen : faites l’envoi depuis votre téléphone, comme indiqué.",
    );
  }
  if (p.devise !== "MGA") {
    redirectWithErreur(page, "Les portefeuilles mobiles n’acceptent que l’Ariary.");
  }

  const reference = referenceReglement();
  await prisma.paiement.update({
    where: { id: p.id },
    data: { reference, statut: "en_cours" },
  });

  const base = baseSite();
  const ouverture = await ouvrirPaiement({
    montant: p.montant,
    reference,
    panier: p.invoice?.numero ?? reference,
    mode: "mobile_money",
    notifUrl: `${base}/api/paiements/vanillapay`,
    redirectUrl: `${await baseRetour()}/membre/cotisations/retour?ref=${encodeURIComponent(reference)}`,
  });
  if ("raison" in ouverture) redirectWithErreur(page, ouverture.raison);
  await garderLien(p.id, ouverture.id);

  redirect(ouverture.url);
}
