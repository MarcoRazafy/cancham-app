"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { redirectWithErreur } from "@/lib/flash";
import { getCurrentUser } from "@/lib/session";
import { baseSite } from "@/lib/site";
import {
  estModePaiement,
  ouvrirPaiement,
  referencePaiement,
  vanillaPayActif,
} from "@/lib/vanillapay";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/**
 * Règlement en ligne d'une facture, par le membre lui-même.
 *
 * Une action serveur est une adresse publique : on vérifie donc que la
 * facture appartient bien à qui la règle, qu'elle n'est pas déjà payée, et
 * qu'elle est en Ariary — Vanilla Pay n'encaisse pas le dollar canadien.
 *
 * La tentative est enregistrée **avant** l'appel au prestataire : c'est elle
 * qui portera sa notification, et une tentative sans trace serait un
 * paiement qu'on ne saurait pas rattacher.
 */
export async function payerEnLigne(formData: FormData) {
  const user = await getCurrentUser("membre");
  const retour = "/membre/cotisations";

  const mode = texte(formData, "mode");
  if (!estModePaiement(mode)) {
    redirectWithErreur(retour, "Choisissez un moyen de paiement.");
  }
  if (!vanillaPayActif()) {
    redirectWithErreur(retour, "Le paiement en ligne n’est pas disponible.");
  }

  const f = await prisma.invoice.findUnique({
    where: { id: texte(formData, "factureId") },
    select: {
      id: true,
      numero: true,
      objet: true,
      montant: true,
      devise: true,
      statut: true,
      memberId: true,
    },
  });

  // Même message pour « introuvable » et « pas à vous » : répondre
  // différemment dirait à un curieux quelles factures existent.
  if (!f || !user.memberId || f.memberId !== user.memberId) {
    redirectWithErreur(retour, "Facture introuvable.");
  }
  if (f.statut === "payee") {
    redirectWithErreur(retour, `La facture ${f.numero} est déjà réglée.`);
  }
  if (f.devise !== "MGA") {
    redirectWithErreur(
      retour,
      "Cette cotisation se règle par virement : le paiement en ligne n’accepte que l’Ariary.",
    );
  }

  const reference = referencePaiement(f.numero);
  const paiement = await prisma.paiement.create({
    data: {
      reference,
      invoiceId: f.id,
      montant: f.montant,
      devise: f.devise,
      mode,
    },
    select: { id: true },
  });

  const base = baseSite();
  const ouverture = await ouvrirPaiement({
    montant: f.montant,
    reference,
    libelle: `${f.objet} — facture ${f.numero}`,
    mode,
    notifUrl: `${base}/api/paiements/vanillapay`,
    redirectUrl: `${base}/membre/cotisations/retour?ref=${encodeURIComponent(reference)}`,
  });

  if ("raison" in ouverture) {
    await prisma.paiement.update({
      where: { id: paiement.id },
      data: { statut: "echouee" },
    });
    redirectWithErreur(retour, ouverture.raison);
  }

  // Sortie du site : la carte se saisit chez eux, jamais chez nous.
  redirect(ouverture.url);
}
