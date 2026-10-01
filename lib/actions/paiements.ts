"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";
import { ouvrirChezLePrestataire } from "@/lib/paiement-en-ligne";
import { estPortefeuilleConnu } from "@/lib/portefeuilles";
import { getCurrentUser } from "@/lib/session";
import { mobileMoneyEnLigne, vanillaPayActif } from "@/lib/vanillapay";

const texte = (fd: FormData, k: string) =>
  String(fd.get(k) ?? "")
    .replace(/\s+/g, " ")
    .trim();

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
 * D'ordinaire, le membre n'arrive pas ici : la tuile « Carte bancaire »
 * l'envoie droit chez le prestataire. Cet écran sert quand l'ouverture a été
 * refusée — un montant sous leur plancher, une panne —, ou quand il revient
 * sur un règlement resté ouvert.
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

  // Le nom saisi est gardé même si rien ne part : le membre n'aura pas à le
  // refaire.
  await prisma.paiement.update({
    where: { id: p.id },
    data: { detail: { titulaire } },
  });

  // Sans les clés du prestataire, rien ne part.
  if (!vanillaPayActif()) {
    redirectWithErreur(
      page,
      "Le paiement par carte n’est pas encore raccordé : la chambre attend ses accès au prestataire. En attendant, choisissez un autre moyen.",
    );
  }
  if (p.devise !== "MGA") {
    redirectWithErreur(page, "Le paiement par carte n’accepte que l’Ariary.");
  }

  const ouverture = await ouvrirChezLePrestataire(
    { id: p.id, montant: p.montant, numeroFacture: p.invoice?.numero ?? null },
    "international",
    { titulaire },
  );
  // Le règlement reste ouvert : le membre peut réessayer sans tout ressaisir.
  if ("raison" in ouverture) redirectWithErreur(page, ouverture.raison);

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

  const ouverture = await ouvrirChezLePrestataire(
    { id: p.id, montant: p.montant, numeroFacture: p.invoice?.numero ?? null },
    "mobile_money",
  );
  if ("raison" in ouverture) redirectWithErreur(page, ouverture.raison);

  redirect(ouverture.url);
}
