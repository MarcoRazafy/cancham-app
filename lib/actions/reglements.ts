"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { delivrerBillets, delivrerBilletsPublics } from "@/lib/billets";
import { inscriptionPublique } from "@/lib/paiements";
import { ouvrirChezLePrestataire } from "@/lib/paiement-en-ligne";
import { vanillaPayActif } from "@/lib/vanillapay";
import { prisma } from "@/lib/db";
import { exigerEquipe } from "@/lib/autorisations";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";
import { ajouterJours, estJourISO } from "@/lib/agenda";
import { aujourdhuiISO, fmtDate } from "@/lib/format";
import { fmtMontant } from "@/lib/membership";
import { getCurrentUser } from "@/lib/session";
import {
  estModeReglement,
  MODES,
  modesProposes,
  referenceReglement,
  type ModeReglement,
} from "@/lib/reglements";
import {
  estPortefeuilleConnu,
  normaliserNumero,
  numeroDeLOperateur,
  PORTEFEUILLES,
} from "@/lib/portefeuilles";
import { after } from "next/server";
import { notifierEquipe, notifierMembre } from "@/lib/push";

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
  // Une tuile grisée n'envoie rien, mais une action serveur est une adresse
  // publique : un moyen qui n'est pas proposé ne s'ouvre pas non plus ici.
  if (!(await modesProposes()).includes(mode)) {
    redirectWithErreur(retour, `${MODES[mode].titre} : pas encore disponible.`);
  }

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
    select: { id: true, montant: true },
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
      select: { id: true, montant: true },
    }));
  const page = `/membre/cotisations/payer/${p.id}`;

  // La carte n'a rien à préparer chez nous : on ouvre le paiement chez le
  // prestataire tout de suite, et le membre arrive sur sa page de saisie. Le
  // titulaire noté est celui qui paie — c'est ce que l'équipe regarde si le
  // paiement est contesté. Si l'ouverture est refusée — un montant sous leur
  // plancher, une panne —, il arrive sur l'écran de la carte, qui lui dit
  // pourquoi et le laisse réessayer ou changer de moyen.
  if (mode === "carte" && vanillaPayActif() && f.devise === "MGA") {
    const ouverture = await ouvrirChezLePrestataire(
      { id: p.id, montant: p.montant, numeroFacture: f.numero },
      "international",
      { titulaire: user.nom },
    );
    if ("raison" in ouverture) redirectWithErreur(page, ouverture.raison);
    redirect(ouverture.url);
  }

  redirect(page);
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
 * La remise en espèces : où et quand le membre apporte l'argent.
 *
 * Le bon de remise qui en sort vaut annonce — l'équipe voit le rendez-vous
 * dans ses règlements annoncés, et confirme le jour où l'argent change de
 * main. Revenir sur le rendez-vous reste possible tant que rien n'est
 * encaissé.
 */
export async function preparerRemiseEspeces(formData: FormData) {
  const user = await getCurrentUser("membre");
  const id = texte(formData, "reglementId");

  const p = await prisma.paiement.findUnique({
    where: { id },
    select: {
      id: true,
      memberId: true,
      mode: true,
      statut: true,
      reference: true,
      montant: true,
      devise: true,
      member: { select: { nom: true } },
    },
  });
  if (!p || !user.memberId || p.memberId !== user.memberId) {
    redirectWithErreur("/membre/cotisations", "Règlement introuvable.");
  }
  const page = `/membre/cotisations/payer/${p.id}`;
  const formulaire = `${page}?modifier=1`;
  if (p.mode !== "especes") {
    redirectWithErreur(page, "Ce règlement ne se fait pas en espèces.");
  }
  if (p.statut === "reussie") {
    redirectWithFlash("/membre/cotisations", "Ce règlement est déjà encaissé.");
  }

  const lieu = texte(formData, "lieu") === "domicile" ? "domicile" : "bureau";
  const adresse = texte(formData, "adresse").replace(/\s+/g, " ").slice(0, 200);
  if (lieu === "domicile" && !adresse) {
    redirectWithErreur(formulaire, "Indiquez où l’équipe doit passer.");
  }

  const jour = texte(formData, "jour");
  const aujourdhui = aujourdhuiISO();
  if (!estJourISO(jour)) {
    redirectWithErreur(formulaire, "Choisissez le jour de la remise.");
  }
  if (jour < aujourdhui) {
    redirectWithErreur(formulaire, "Ce jour est déjà passé.");
  }
  if (jour > ajouterJours(aujourdhui, 90)) {
    redirectWithErreur(
      formulaire,
      "Choisissez un jour dans les trois prochains mois.",
    );
  }
  const moment =
    texte(formData, "moment") === "apres-midi" ? "apres-midi" : "matin";

  await prisma.paiement.update({
    where: { id: p.id },
    data: {
      statut: "annonce",
      annonceLe: new Date(),
      detail: {
        lieu,
        adresse: lieu === "domicile" ? adresse : null,
        jour,
        moment,
        remisPar: user.nom,
      },
    },
  });
  after(() =>
    notifierEquipe({
      titre: "Remise en espèces annoncée",
      corps: `${p.member?.nom ?? user.nom} · ${fmtMontant(p.montant, p.devise)} · ${lieu === "domicile" ? "à domicile" : "au bureau"} le ${fmtDate(jour, { day: "numeric", month: "long" })}, ${moment === "matin" ? "le matin" : "l’après-midi"}`,
      url: "/admin/reglements",
      etiquette: `reglement-${p.id}`,
    }),
  );
  revalidatePath("/", "layout");
  redirect(page);
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
    select: {
      id: true,
      memberId: true,
      statut: true,
      reference: true,
      mode: true,
      montant: true,
      devise: true,
      member: { select: { nom: true } },
    },
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
  // L'équipe le sait sur son téléphone : un règlement attend sa confirmation.
  after(() =>
    notifierEquipe({
      titre: "Règlement annoncé",
      corps: `${p.member?.nom ?? user.nom} · ${fmtMontant(p.montant, p.devise)} par ${MODES[p.mode as ModeReglement].titre.toLowerCase()} · réf. ${p.reference}`,
      url: "/admin/reglements",
      etiquette: `reglement-${p.id}`,
    }),
  );
  revalidatePath("/", "layout");
  redirectWithFlash(
    "/membre/cotisations",
    `Règlement ${p.reference} annoncé · l’équipe confirmera dès réception`,
  );
}

/* ==================== Ce que l'équipe en fait ==================== */

/** Le nom donné à l'inscription publique qu'un règlement vient payer. */
function payeurPublic(detail: unknown): string | null {
  const d = (detail ?? {}) as { titulaire?: unknown };
  return typeof d.titulaire === "string" && d.titulaire ? d.titulaire : null;
}

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
    `${montant} par ${moyen.toLowerCase()} · ${p.member?.nom ?? payeurPublic(p.detail) ?? "—"} · réf. ${p.reference}`,
    user.nom,
  );
  // Une participation : l'inscription se confirme et les billets partent.
  if (p.invoice) await delivrerBillets(p.invoice.id, user.nom);
  // Celle d'un visiteur n'a pas de facture : c'est le code de son
  // inscription, gardé avec le règlement, qui désigne ses billets.
  const publique = p.invoice ? null : inscriptionPublique(p.detail);
  if (publique) {
    await delivrerBilletsPublics(publique.eventId, publique.code, user.nom);
  }
  if (p.member) {
    const memberId = p.member.id;
    after(() =>
      notifierMembre(memberId, {
        titre: "Paiement confirmé",
        corps: `${montant} · réf. ${p.reference} · merci !${cotisation ? " Votre adhésion est à jour." : ""}`,
        url: p.invoice
          ? `/membre/cotisations/${p.invoice.id}`
          : "/membre/cotisations",
      }),
    );
  }
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
    select: { id: true, reference: true, statut: true, memberId: true },
  });
  if (!p) redirectWithErreur(retour, "Règlement introuvable.");
  if (p.statut === "reussie") {
    redirectWithErreur(retour, "Ce règlement est déjà encaissé.");
  }

  await prisma.paiement.update({
    where: { id: p.id },
    data: { statut: "echouee" },
  });
  if (p.memberId) {
    const memberId = p.memberId;
    after(() =>
      notifierMembre(memberId, {
        titre: "Règlement non constaté",
        corps: `Réf. ${p.reference} · l’équipe n’a pas retrouvé votre paiement. Reprenez depuis vos cotisations.`,
        url: "/membre/cotisations",
      }),
    );
  }
  await journal(
    "reglement_refuse",
    p.reference,
    texte(formData, "motif") || "Argent non constaté.",
    user.nom,
  );
  revalidatePath("/", "layout");
  redirectWithFlash(retour, `Règlement ${p.reference} écarté`);
}
