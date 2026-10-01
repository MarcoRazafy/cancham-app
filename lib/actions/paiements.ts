"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { lignesDe } from "@/lib/billets";
import { codeInscription, extraireCode } from "@/lib/codes-accueil";
import { prisma } from "@/lib/db";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";
import { minutes, origineAppelante, tentative } from "@/lib/limite";
import { ouvrirChezLePrestataire } from "@/lib/paiement-en-ligne";
import { estPortefeuilleConnu } from "@/lib/portefeuilles";
import { fmtMontant } from "@/lib/membership";
import { reglementPublicOuvert } from "@/lib/paiements";
import { notifierEquipe } from "@/lib/push";
import {
  estModeReglement,
  MODES,
  modesPublics,
  referenceReglement,
  type ModeReglement,
} from "@/lib/reglements";
import { getCurrentUser } from "@/lib/session";
import {
  mobileMoneyEnLigne,
  MONTANT_MINIMUM_EN_LIGNE,
  vanillaPayActif,
} from "@/lib/vanillapay";

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
    redirectWithErreur(
      page,
      "Ce règlement ne se fait pas par portefeuille mobile.",
    );
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
    redirectWithErreur(
      page,
      "Les portefeuilles mobiles n’acceptent que l’Ariary.",
    );
  }

  const ouverture = await ouvrirChezLePrestataire(
    { id: p.id, montant: p.montant, numeroFacture: p.invoice?.numero ?? null },
    "mobile_money",
  );
  if ("raison" in ouverture) redirectWithErreur(page, ouverture.raison);

  redirect(ouverture.url);
}

/** Ouvertures de paiement depuis une même origine, en une heure. */
const PAIEMENTS_PUBLICS_PAR_HEURE = 10;

/**
 * L'inscription publique qu'un formulaire vient régler, contrôlée.
 *
 * Pas de compte, donc pas de session à vérifier : c'est le code de
 * l'inscription — celui du lien reçu par e-mail — qui fait foi, comme pour
 * la page des billets. On ne règle que des lignes encore en attente, au
 * tarif public du jour, et jamais une inscription de membre : celle-là a sa
 * facture, qui se règle dans l'espace membre.
 */
async function inscriptionAPayer(formData: FormData) {
  const eventId = texte(formData, "eventId");
  const code = codeInscription(extraireCode(texte(formData, "code")));
  const page = `/evenements/${eventId}/billet?${new URLSearchParams({ code })}`;

  const attente = tentative(
    `paiement-public:${await origineAppelante()}`,
    PAIEMENTS_PUBLICS_PAR_HEURE,
    60 * 60 * 1000,
  );
  if (attente) {
    redirectWithErreur(
      page,
      `Trop de tentatives depuis cet appareil. Réessayez dans ${minutes(attente)} minute${minutes(attente) > 1 ? "s" : ""}.`,
    );
  }

  const [event, lignes, inscriptionMembre] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      select: { titre: true, public: true, prixPublic: true },
    }),
    prisma.attendee.findMany({
      where: { eventId, statut: "a_valider", ...lignesDe(code) },
      orderBy: { createdAt: "asc" },
      select: { nom: true, email: true },
    }),
    prisma.registration.findUnique({ where: { code }, select: { id: true } }),
  ]);
  if (!event?.public || inscriptionMembre) {
    redirectWithErreur(`/evenements/${eventId}`, "Inscription introuvable.");
  }
  if (!lignes.length) {
    redirectWithFlash(page, "Cette inscription est déjà réglée.");
  }
  return {
    eventId,
    code,
    page,
    event,
    lignes,
    montant: event.prixPublic * lignes.length,
  };
}

/**
 * Le règlement d'une inscription publique, dans le moyen choisi.
 *
 * Un seul par inscription : changer de moyen, ou revenir sans payer puis
 * recommencer, reprend le même, au montant du jour — on n'en empile pas dix.
 * Il n'a ni facture ni membre ; c'est le code de l'inscription, gardé dans
 * son détail, qui le relie aux billets.
 */
async function reglementPublic(
  code: string,
  mode: ModeReglement,
  montant: number,
) {
  const ouvert = await reglementPublicOuvert(code);
  return ouvert
    ? prisma.paiement.update({
        where: { id: ouvert.id },
        // Un moyen changé repart de zéro : l'annonce faite dans l'ancien ne
        // vaut plus.
        data: {
          montant,
          mode,
          ...(ouvert.mode === mode
            ? {}
            : { statut: "en_cours", annonceLe: null, refBancaire: null }),
        },
        select: { id: true, reference: true, statut: true },
      })
    : prisma.paiement.create({
        data: {
          reference: referenceReglement(),
          montant,
          devise: "MGA",
          mode,
        },
        select: { id: true, reference: true, statut: true },
      });
}

/**
 * Le visiteur choisit comment régler son inscription.
 *
 * La carte mène chez le prestataire. Les autres moyens se passent hors
 * ligne : on ouvre le règlement, et la page des billets affiche où envoyer
 * l'argent et la référence à rappeler.
 */
export async function choisirPaiementPublic(formData: FormData) {
  const mode = texte(formData, "mode");
  if (mode === "carte") return payerInscriptionPublique(formData);

  const { eventId, code, page, lignes, montant } =
    await inscriptionAPayer(formData);
  if (
    !estModeReglement(mode) ||
    !(await modesPublics(montant)).includes(mode)
  ) {
    redirectWithErreur(page, "Ce moyen de paiement n’est pas proposé.");
  }

  const p = await reglementPublic(code, mode, montant);
  await prisma.paiement.update({
    where: { id: p.id },
    data: {
      detail: {
        inscription: code,
        eventId,
        titulaire: lignes[0].nom,
        email: lignes[0].email,
      },
    },
  });
  revalidatePath(`/evenements/${eventId}/billet`);
  redirect(page);
}

/**
 * Le visiteur annonce avoir payé hors ligne.
 *
 * Rien n'est encaissé pour autant : l'inscription attend que l'équipe
 * constate l'arrivée de l'argent. Elle en est prévenue, et confirme depuis
 * « Règlements annoncés » — les billets partent alors par e-mail.
 */
export async function annoncerPaiementPublic(formData: FormData) {
  const { eventId, code, page, event, lignes } =
    await inscriptionAPayer(formData);

  const p = await reglementPublicOuvert(code);
  if (!p || p.mode === "carte") {
    redirectWithErreur(page, "Choisissez d’abord un moyen de paiement.");
  }
  if (p.statut === "annonce") {
    redirectWithFlash(page, "Votre paiement est déjà annoncé à l’équipe.");
  }

  await prisma.paiement.update({
    where: { id: p.id },
    data: {
      statut: "annonce",
      annonceLe: new Date(),
      refBancaire: texte(formData, "refBancaire").slice(0, 80) || null,
    },
  });
  await prisma.auditLog.create({
    data: {
      action: "reglement_annonce",
      entite: "Event",
      entiteId: eventId,
      acteur: "Inscription publique",
      detail: `${lignes[0].nom} · ${fmtMontant(p.montant, p.devise)} par ${MODES[p.mode].titre.toLowerCase()} · réf. ${p.reference} · « ${event.titre} »`,
    },
  });
  // L'équipe le sait sur son téléphone : un règlement attend sa confirmation.
  after(() =>
    notifierEquipe({
      titre: "Règlement annoncé — inscription publique",
      corps: `${lignes[0].nom} · ${fmtMontant(p.montant, p.devise)} par ${MODES[p.mode].titre.toLowerCase()} · réf. ${p.reference}`,
      url: "/admin/reglements",
      etiquette: `reglement-${p.id}`,
    }),
  );
  revalidatePath("/", "layout");
  redirectWithFlash(
    page,
    "Paiement annoncé : l’équipe confirme dès réception, et vos billets partent par e-mail",
  );
}

/**
 * Le paiement par carte d'une inscription faite depuis le site public.
 *
 * Le règlement n'a ni facture ni membre ; il garde le code de l'inscription
 * et l'événement. C'est ce qui permet, le paiement confirmé, de valider
 * l'inscription et d'envoyer les billets.
 */
export async function payerInscriptionPublique(formData: FormData) {
  const { eventId, code, page, lignes, montant } =
    await inscriptionAPayer(formData);

  if (!vanillaPayActif() || montant < MONTANT_MINIMUM_EN_LIGNE) {
    redirectWithErreur(
      page,
      "Le paiement en ligne n’est pas disponible pour cette inscription : réglez-la auprès de l’équipe CanCham.",
    );
  }

  const p = await reglementPublic(code, "carte", montant);

  const ouverture = await ouvrirChezLePrestataire(
    { id: p.id, montant, numeroFacture: null },
    "international",
    {
      inscription: code,
      eventId,
      titulaire: lignes[0].nom,
      email: lignes[0].email,
    },
    (reference) =>
      `/evenements/${eventId}/billet?${new URLSearchParams({ code, ref: reference })}`,
  );
  if ("raison" in ouverture) redirectWithErreur(page, ouverture.raison);

  redirect(ouverture.url);
}
