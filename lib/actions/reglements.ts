"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigerEquipe } from "@/lib/autorisations";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";
import { fmtMontant } from "@/lib/membership";
import { getCurrentUser } from "@/lib/session";
import { payerEnLigne } from "@/lib/actions/paiements";
import {
  estModeReglement,
  MODES,
  referenceReglement,
  type ModeReglement,
} from "@/lib/reglements";
import {
  estPortefeuilleConnu,
  normaliserNumero,
  numeroDeLOperateur,
  PORTEFEUILLES,
} from "@/lib/portefeuilles";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Une ligne au journal, sous le nom de qui agit. */
async function journal(
  action: string,
  entiteId: string,
  detail: string,
  acteur: string,
) {
  await prisma.auditLog.create({
    data: { action, entite: "Invoice", entiteId, acteur, detail },
  });
}

/* ==================== Coordonnées de la chambre ==================== */

/**
 * Où la chambre reçoit l'argent.
 *
 * Tenues depuis le back-office et non dans le code : un changement de banque
 * ne doit pas demander un déploiement. Un champ laissé vide retire le moyen
 * correspondant du choix offert au membre — mieux vaut un choix plus court
 * qu'un virement envoyé dans le vide.
 */
export async function enregistrerCoordonneesPaiement(formData: FormData) {
  await exigerEquipe();
  const retour = "/admin/reglements/coordonnees";

  const champs = {
    titulaire: texte(formData, "titulaire"),
    banque: texte(formData, "banque"),
    agence: texte(formData, "agence"),
    rib: texte(formData, "rib"),
    iban: texte(formData, "iban").toUpperCase().replace(/\s+/g, " "),
    bic: texte(formData, "bic").toUpperCase(),
    mvola: texte(formData, "mvola"),
    orangeMoney: texte(formData, "orangeMoney"),
    airtelMoney: texte(formData, "airtelMoney"),
    adresseBureau: texte(formData, "adresseBureau"),
    horaires: texte(formData, "horaires"),
    plateformes: texte(formData, "plateformes"),
  };

  await prisma.coordonneesPaiement.upsert({
    where: { id: "uniques" },
    create: { id: "uniques", ...champs },
    update: champs,
  });
  revalidatePath("/", "layout");
  redirectWithFlash(retour, "Coordonnées enregistrées");
}

/* ==================== Le règlement d'une facture ==================== */

/**
 * Ouvre un règlement pour une facture, dans le moyen choisi.
 *
 * La référence est tirée ici, avant tout : c'est elle que le membre recopiera
 * dans le motif de son virement, et elle seule qui permettra de rattacher
 * l'argent arrivé à qui l'a envoyé.
 */
export async function ouvrirReglement(formData: FormData) {
  const user = await getCurrentUser("membre");
  const factureId = texte(formData, "factureId");
  const retour = `/membre/cotisations?regler=${factureId}`;

  const mode = texte(formData, "mode");
  if (!estModeReglement(mode)) {
    redirectWithErreur(retour, "Choisissez un moyen de paiement.");
  }
  // La carte ne se règle pas hors ligne : elle part chez le prestataire, qui
  // vérifie lui-même que ses clés sont posées et que la facture est en
  // Ariary.
  if (mode === "carte") return payerEnLigne(formData);

  const f = await prisma.invoice.findUnique({
    where: { id: factureId },
    select: {
      id: true,
      numero: true,
      montant: true,
      devise: true,
      statut: true,
      memberId: true,
    },
  });
  // Même message pour « introuvable » et « pas à vous » : répondre
  // différemment dirait à un curieux quelles factures existent.
  if (!f || !user.memberId || f.memberId !== user.memberId) {
    redirectWithErreur("/membre/cotisations", "Facture introuvable.");
  }
  if (f.statut === "payee") {
    redirectWithErreur(
      "/membre/cotisations",
      `La facture ${f.numero} est déjà réglée.`,
    );
  }

  // Un règlement déjà ouvert dans le même moyen se reprend au lieu d'en
  // créer un second : deux références pour un même virement se traduiraient
  // par deux lignes à rapprocher, dont une fantôme.
  const ouvert = await prisma.paiement.findFirst({
    where: { invoiceId: f.id, mode: mode as ModeReglement, statut: "en_cours" },
    select: { id: true },
  });
  const p =
    ouvert ??
    (await prisma.paiement.create({
      data: {
        reference: referenceReglement(),
        invoiceId: f.id,
        memberId: f.memberId,
        montant: f.montant,
        devise: f.devise,
        mode: mode as ModeReglement,
      },
      select: { id: true },
    }));

  redirect(`/membre/cotisations/payer/${p.id}`);
}

/**
 * Le numéro depuis lequel le membre va payer, dans un portefeuille mobile.
 *
 * Il est vérifié contre les préfixes de l'opérateur : une ligne Orange ne
 * peut pas envoyer de MVola, et découvrir l'erreur sur le téléphone, le
 * montant déjà saisi, est une perte de temps pour tout le monde. Le numéro
 * sert ensuite à l'équipe pour reconnaître l'envoi qui arrive.
 */
export async function enregistrerNumeroPortefeuille(formData: FormData) {
  const user = await getCurrentUser("membre");
  const id = texte(formData, "reglementId");

  const p = await prisma.paiement.findUnique({
    where: { id },
    select: { id: true, memberId: true, mode: true, statut: true },
  });
  if (!p || !user.memberId || p.memberId !== user.memberId) {
    redirectWithErreur("/membre/cotisations", "Règlement introuvable.");
  }
  const retour = `/membre/cotisations/payer/${p.id}`;
  if (!estPortefeuilleConnu(p.mode)) {
    redirectWithErreur(
      retour,
      "Ce règlement n’est pas un portefeuille mobile.",
    );
  }

  const numero = normaliserNumero(texte(formData, "telephone"));
  if (!numero) {
    redirectWithErreur(
      `${retour}?numero=modifier`,
      "Numéro incomplet : dix chiffres, comme 034 12 345 67.",
    );
  }
  if (!numeroDeLOperateur(p.mode, numero)) {
    const { prefixes } = PORTEFEUILLES[p.mode];
    redirectWithErreur(
      `${retour}?numero=modifier`,
      `Un numéro ${MODES[p.mode].titre} commence par ${prefixes.join(" ou ")}.`,
    );
  }

  await prisma.paiement.update({
    where: { id: p.id },
    data: { detail: { telephone: numero } },
  });
  revalidatePath(retour);
  redirect(retour);
}

/**
 * Le membre annonce avoir payé hors ligne.
 *
 * Rien n'est encaissé pour autant : la facture attend que l'équipe constate
 * l'arrivée de l'argent. Annoncer n'est pas payer, et la plateforme ne doit
 * jamais laisser croire le contraire.
 */
export async function annoncerReglement(formData: FormData) {
  const user = await getCurrentUser("membre");
  const id = texte(formData, "reglementId");

  const p = await prisma.paiement.findUnique({
    where: { id },
    select: { id: true, memberId: true, statut: true, reference: true },
  });
  if (!p || !user.memberId || p.memberId !== user.memberId) {
    redirectWithErreur("/membre/cotisations", "Règlement introuvable.");
  }
  if (p.statut === "reussie") {
    redirectWithFlash("/membre/cotisations", "Ce règlement est déjà encaissé.");
  }

  await prisma.paiement.update({
    where: { id: p.id },
    data: {
      statut: "annonce",
      annonceLe: new Date(),
      refBancaire: texte(formData, "refBancaire") || null,
    },
  });
  revalidatePath("/", "layout");
  redirectWithFlash(
    "/membre/cotisations",
    `Règlement ${p.reference} annoncé · l’équipe confirmera dès réception`,
  );
}

/* ==================== Ce que l'équipe en fait ==================== */

/** L'équipe constate que l'argent est arrivé. */
export async function confirmerReglement(formData: FormData) {
  const user = await exigerEquipe();
  const id = texte(formData, "reglementId");
  const retour = "/admin/reglements";

  const p = await prisma.paiement.findUnique({
    where: { id },
    include: {
      invoice: {
        select: { id: true, numero: true, objet: true, statut: true },
      },
      member: { select: { id: true, nom: true, statut: true } },
    },
  });
  if (!p) redirectWithErreur(retour, "Règlement introuvable.");
  if (p.statut === "reussie") redirectWithFlash(retour, "Déjà confirmé.");

  const cotisation =
    p.invoice !== null &&
    /^cotisation/i.test(p.invoice.objet) &&
    p.member !== null &&
    p.member.statut !== "a_jour";
  const montant = fmtMontant(p.montant, p.devise);
  const moyen = MODES[p.mode as ModeReglement].titre;

  await prisma.$transaction([
    prisma.paiement.update({
      where: { id: p.id },
      data: { statut: "reussie", regleLe: new Date(), confirmePar: user.nom },
    }),
    ...(p.invoice && p.invoice.statut !== "payee"
      ? [
          prisma.invoice.update({
            where: { id: p.invoice.id },
            data: { statut: "payee" },
          }),
        ]
      : []),
    ...(cotisation && p.member
      ? [
          prisma.member.update({
            where: { id: p.member.id },
            data: {
              statut: "a_jour",
              retardDepuis: null,
              paiementNote: `Payé par ${moyen.toLowerCase()} · ${montant}`,
            },
          }),
        ]
      : []),
  ]);

  await journal(
    "reglement_confirme",
    p.invoice?.numero ?? p.reference,
    `${montant} par ${moyen.toLowerCase()} · ${p.member?.nom ?? "—"} · réf. ${p.reference}`,
    user.nom,
  );
  revalidatePath("/", "layout");
  redirectWithFlash(retour, `Règlement ${p.reference} confirmé`);
}

/** L'argent n'est jamais arrivé, ou pas du bon montant. */
export async function refuserReglement(formData: FormData) {
  const user = await exigerEquipe();
  const id = texte(formData, "reglementId");
  const retour = "/admin/reglements";

  const p = await prisma.paiement.findUnique({
    where: { id },
    select: { id: true, reference: true, statut: true },
  });
  if (!p) redirectWithErreur(retour, "Règlement introuvable.");
  if (p.statut === "reussie") {
    redirectWithErreur(retour, "Ce règlement est déjà encaissé.");
  }

  await prisma.paiement.update({
    where: { id: p.id },
    data: { statut: "echouee" },
  });
  await journal(
    "reglement_refuse",
    p.reference,
    texte(formData, "motif") || "Argent non constaté.",
    user.nom,
  );
  revalidatePath("/", "layout");
  redirectWithFlash(retour, `Règlement ${p.reference} écarté`);
}
