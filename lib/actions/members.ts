"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import {
  COURRIEL_EQUIPE,
  courrielsActifs,
  envoyerCourriel,
  urlPublique,
} from "@/lib/courriel";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";
import { numeroFacture } from "@/lib/factures";
import { hacher, MOT_DE_PASSE_MIN } from "@/lib/auth";
import { jourBase, jourSaisi } from "@/lib/format";
import { minutes, origineAppelante, tentative } from "@/lib/limite";
import { creerJeton } from "@/lib/jetons";
import {
  FORMULES,
  fmtCotisation,
  fmtMontant,
  libelleFormule,
  type Devise,
} from "@/lib/membership";
import {
  courrielDemandeApprouvee,
  courrielInvitation,
  courrielNouvelleInscription,
  courrielRelanceCotisation,
} from "@/lib/modeles-courriels";
import { enregistrerImage, ImageRefusee } from "@/lib/uploads";
import { normaliserSite } from "@/lib/liens";
import { PHOTOS_PAR_PRODUIT } from "@/lib/membership";
import {
  exigerContact,
  exigerEquipe,
  exigerFiche,
  exigerProduit,
} from "@/lib/autorisations";
import { getCurrentUser } from "@/lib/session";
import type { MemberStatus, MemberType } from "@/lib/types";

/**
 * Actions sur les membres et les cotisations.
 *
 * Toute opération financière ou destructrice laisse une trace dans `audit_logs` :
 * une validation de paiement ou une suppression de membre ne doit jamais
 * disparaître silencieusement.
 */

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Demandes d'adhésion déposées depuis une même origine en une heure. */
const DEMANDES_PAR_HEURE = 5;

/** Page de retour d'un formulaire public : un chemin interne, jamais ailleurs. */
function cheminRetour(fd: FormData, defaut: string): string {
  const r = texte(fd, "retour");
  return r.startsWith("/") && !r.startsWith("//") ? r : defaut;
}

async function journal(
  action: string,
  entite: string,
  entiteId: string,
  acteur: string,
  detail?: string,
) {
  await prisma.auditLog.create({
    data: { action, entite, entiteId, acteur, detail },
  });
}

function revalideTout() {
  revalidatePath("/", "layout");
}

/** La personne de l'équipe qui agit, nommée dans le journal. */
async function acteurEquipe(): Promise<string> {
  return (await getCurrentUser("admin")).nom;
}

/**
 * Page de retour d'un formulaire partagé entre les espaces.
 *
 * Seul un chemin interne est accepté : une adresse complète glissée dans le
 * champ ferait de l'action un tremplin vers un site tiers.
 */
function retourInterne(fd: FormData, defaut: string): string {
  const r = texte(fd, "retour");
  return r.startsWith("/") && !r.startsWith("//") ? r : defaut;
}

/** Qui agit sur un contact : l'équipe depuis le back-office, le membre sinon. */
async function acteurDepuis(retour: string): Promise<string> {
  return (
    await getCurrentUser(retour.startsWith("/admin") ? "admin" : "membre")
  ).nom;
}

/**
 * Invitation d'un compte créé sans mot de passe — contact ajouté par
 * l'équipe ou par un collègue : un lien pour choisir le sien. L'envoi part
 * après la réponse.
 */
async function inviter(
  userId: string,
  email: string,
  nom: string,
  entreprise: string | null,
) {
  const base = await urlPublique("/public/nouveau-mot-de-passe");
  after(async () => {
    const jeton = await creerJeton(userId, "invitation");
    await envoyerCourriel(
      courrielInvitation(email, nom, entreprise, `${base}?jeton=${jeton}`),
    );
  });
}

/** Contact à qui écrire pour une entreprise : le référent, sinon le premier. */
async function contactDe(memberId: string) {
  return prisma.user.findFirst({
    where: { memberId, role: "membre" },
    orderBy: [{ contactPrincipal: "desc" }, { createdAt: "asc" }],
    select: { nom: true, email: true },
  });
}

/* ============================ Candidatures ============================ */

/** Dépôt d'une demande depuis l'espace public. */
export async function submitAdhesion(formData: FormData) {
  // Formulaire public : une même origine ne dépose pas des demandes en rafale.
  const attente = tentative(
    `adhesion:${await origineAppelante()}`,
    DEMANDES_PAR_HEURE,
    60 * 60 * 1000,
  );
  if (attente) {
    redirectWithErreur(
      cheminRetour(formData, "/public/inscription"),
      `Trop de demandes depuis cet appareil. Réessayez dans ${minutes(attente)} minute${minutes(attente) > 1 ? "s" : ""}.`,
    );
  }

  // Nom et prénom sont saisis à part, comme sur la fiche de la chambre. Les
  // anciens formulaires envoient encore un « rep » d'un seul tenant.
  const prenomRep = texte(formData, "prenomRep");
  const nomRep = texte(formData, "nomRep");
  const rep =
    [prenomRep, nomRep].filter(Boolean).join(" ") ||
    texte(formData, "rep") ||
    "À préciser";

  // « Mettre N/A si pas d'entreprise » : la fiche de la chambre distingue ainsi
  // l'indépendant de l'entreprise. Une case vide dit la même chose.
  const nomSaisi = texte(formData, "nom");
  const sansEntreprise = !nomSaisi || /^n\s*\/?\s*a$/i.test(nomSaisi);
  const type = (texte(formData, "type") ||
    (sansEntreprise ? "physique" : "morale")) as MemberType;
  const nom = sansEntreprise ? (type === "physique" ? rep : "") : nomSaisi;

  const formuleSaisie = texte(formData, "formule");
  const formule = (
    formuleSaisie in FORMULES ? formuleSaisie : "mg_entreprise"
  ) as keyof typeof FORMULES;

  const retourInscription = cheminRetour(formData, "/public/inscription");
  if (!nom) {
    redirectWithErreur(
      retourInscription,
      "Merci d’indiquer le nom de votre entreprise ou votre nom.",
    );
  }

  const email = texte(formData, "email").toLowerCase();
  const motDePasse = String(formData.get("motDePasse") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (!email) {
    redirectWithErreur(retourInscription, "Indiquez votre adresse courriel.");
  }
  if (motDePasse.length < MOT_DE_PASSE_MIN) {
    redirectWithErreur(
      retourInscription,
      `Le mot de passe fait au moins ${MOT_DE_PASSE_MIN} caractères.`,
    );
  }
  if (motDePasse !== confirmation) {
    redirectWithErreur(
      retourInscription,
      "Les deux mots de passe ne correspondent pas.",
    );
  }
  if (
    await prisma.user.findUnique({ where: { email }, select: { id: true } })
  ) {
    redirectWithErreur(
      retourInscription,
      "Cette adresse a déjà un compte : connectez-vous.",
    );
  }

  const membre = await prisma.member.create({
    data: {
      type,
      nom,
      secteur: texte(formData, "secteur") || "Secteur à préciser",
      ville: texte(formData, "ville") || "Antananarivo",
      statut: "candidature",
      formule,
      adhesion: jourBase(),
      activite: texte(formData, "desc").slice(0, 120) || "Activité à préciser.",
      desc: texte(formData, "desc") || "Description à compléter.",
      statutJuridique: texte(formData, "statutJuridique") || null,
      pays: texte(formData, "pays") || null,
      siteweb: texte(formData, "siteweb") || null,
      motivation: texte(formData, "motivation") || "À compléter.",
    },
  });

  // Le représentant devient le contact principal de l'entreprise, et le
  // compte avec lequel il se connectera : son accès restera limité à sa fiche
  // et à ses cotisations tant que la candidature n'est pas validée et réglée.
  await prisma.user.create({
    data: {
      role: "membre",
      nom: rep,
      fonction:
        texte(formData, "repTitre") ||
        (type === "physique" ? "Indépendant(e)" : "Représentant(e)"),
      email,
      motDePasse: hacher(motDePasse),
      tel: texte(formData, "tel") || null,
      memberId: membre.id,
      contactPrincipal: true,
    },
  });

  await journal(
    "candidature_deposee",
    "Member",
    membre.id,
    rep,
    `Demande de ${nom}.`,
  );
  const fiche = await urlPublique(`/admin/membres/${membre.id}`);
  after(() =>
    envoyerCourriel(
      courrielNouvelleInscription(
        COURRIEL_EQUIPE,
        email,
        [
          `Demande de ${nom}.`,
          texte(formData, "motivation")
            ? `Sa motivation : « ${texte(formData, "motivation")} »`
            : null,
        ],
        fiche,
      ),
    ),
  );
  revalideTout();
  // Comme pour l'inscription : retour à la connexion, l'adresse déjà
  // remplie. La fiche, elle, explique ensuite ce qu'il reste à faire.
  redirect(`/public?${new URLSearchParams({ inscrit: "1", email })}`);
}

/** Approbation : la demande devient une adhésion en attente de règlement. */
export async function approveCandidature(formData: FormData) {
  await exigerEquipe();
  const id = texte(formData, "memberId");
  const m = await prisma.member.update({
    where: { id },
    data: { statut: "en_attente" },
  });
  await journal(
    "candidature_approuvee",
    "Member",
    id,
    await acteurEquipe(),
    `${m.nom} · en attente du paiement de la cotisation.`,
  );
  const contact = await contactDe(id);
  if (contact) {
    const lien = await urlPublique("/membre/cotisations");
    after(() =>
      envoyerCourriel(
        courrielDemandeApprouvee(contact.email, {
          nom: contact.nom,
          entreprise: m.nom,
          formule: libelleFormule(m.formule),
          montant: fmtCotisation(m.formule),
          lien,
        }),
      ),
    );
  }
  revalideTout();
  redirectWithFlash(
    `/admin/membres/${id}`,
    `Demande approuvée pour ${m.nom} · en attente du paiement de la cotisation`,
  );
}

export async function rejectCandidature(formData: FormData) {
  await exigerEquipe();
  const id = texte(formData, "memberId");
  const m = await prisma.member.findUnique({
    where: { id },
    select: { nom: true },
  });
  await journal(
    "candidature_refusee",
    "Member",
    id,
    await acteurEquipe(),
    `Demande de ${m?.nom ?? id} refusée.`,
  );
  await prisma.member.delete({ where: { id } });
  revalideTout();
  redirectWithFlash(
    "/admin/membres",
    `Demande de ${m?.nom ?? "ce candidat"} refusée`,
  );
}

/* ============================ Cotisations ============================ */

/** Enregistrement d'un règlement encaissé par l'équipe. Génère la facture. */
export async function registerPayment(formData: FormData) {
  await exigerEquipe();
  const id = texte(formData, "memberId");
  const mode = texte(formData, "mode") || "Espèces";
  const dateSaisie = texte(formData, "date");
  const date = jourBase(jourSaisi(dateSaisie) ?? undefined);
  const note = texte(formData, "note");

  const avant = await prisma.member.findUnique({
    where: { id },
    select: { nom: true, paiementNote: true, formule: true },
  });
  if (!avant) redirectWithErreur("/admin/membres", "Membre introuvable.");

  // Montant saisi, sinon celui de la formule. La devise suit toujours la
  // formule : un montant canadien enregistré en Ariary vaudrait mille fois moins.
  const tarif = FORMULES[avant.formule];
  const montant = Number(formData.get("montant")) || tarif.montant;
  const devise: Devise = tarif.devise;

  const premier = !avant.paiementNote;
  const numero = await numeroFacture(date);

  await prisma.$transaction([
    prisma.member.update({
      where: { id },
      data: {
        statut: "a_jour",
        retardDepuis: null,
        ...(premier ? { adhesion: date } : {}),
        paiementNote: `Payé par ${mode.toLowerCase()} · ${fmtMontant(montant, devise)} · le ${date.toLocaleDateString("fr-FR", { timeZone: "UTC" })}${note ? ` · ${note}` : ""}`,
      },
    }),
    prisma.invoice.create({
      data: {
        numero,
        date,
        objet: premier
          ? "Cotisation annuelle — adhésion"
          : "Cotisation annuelle",
        montant,
        devise,
        statut: "payee",
        memberId: id,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "paiement_enregistre",
        entite: "Invoice",
        entiteId: numero,
        acteur: await acteurEquipe(),
        detail: `${fmtMontant(montant, devise)} par ${mode} pour ${avant.nom}.`,
      },
    }),
  ]);

  revalideTout();
  redirectWithFlash(
    `/admin/membres/${id}`,
    `${premier ? "Adhésion activée" : "Paiement enregistré"} pour ${avant.nom} · facture ${numero} générée`,
  );
}

/**
 * Relance de cotisation, par e-mail au contact de l'entreprise.
 *
 * L'envoi est attendu ici, contrairement aux autres : l'équipe doit savoir
 * si la relance est vraiment partie. Le journal ne la consigne que si
 * c'est le cas.
 */
export async function sendReminder(formData: FormData) {
  await exigerEquipe();
  const id = texte(formData, "memberId");
  const fiche = `/admin/membres/${id}`;
  const m = await prisma.member.findUnique({
    where: { id },
    select: { nom: true, formule: true, retardDepuis: true },
  });
  if (!m) redirectWithErreur("/admin/membres", "Membre introuvable.");
  const contact = await contactDe(id);
  if (!contact) {
    redirectWithErreur(
      fiche,
      `${m.nom} n’a aucun contact à qui écrire : ajoutez-en un d’abord.`,
    );
  }

  const retardJours = m.retardDepuis
    ? Math.max(
        0,
        Math.floor(
          (jourBase().getTime() - m.retardDepuis.getTime()) / 86_400_000,
        ),
      )
    : null;
  const envoye = await envoyerCourriel(
    courrielRelanceCotisation(contact.email, {
      nom: contact.nom,
      entreprise: m.nom,
      formule: libelleFormule(m.formule),
      montant: fmtCotisation(m.formule),
      retardJours: retardJours || null,
      lien: await urlPublique("/membre/cotisations"),
    }),
  );
  if (!envoye) {
    redirectWithErreur(
      fiche,
      courrielsActifs()
        ? `La relance n’a pas pu partir vers ${contact.email}. Réessayez plus tard.`
        : "L’envoi d’e-mails n’est pas encore configuré (RESEND_API_KEY) : aucune relance n’est partie.",
    );
  }

  await journal(
    "relance_envoyee",
    "Member",
    id,
    await acteurEquipe(),
    `Relance de cotisation envoyée à ${contact.email}.`,
  );
  revalideTout();
  redirectWithFlash(fiche, `Relance envoyée à ${contact.email}`);
}

/* ============================ Fiche membre ============================ */

export async function createMember(formData: FormData) {
  await exigerEquipe();
  const type = (texte(formData, "type") || "morale") as MemberType;
  const rep = texte(formData, "rep") || "À préciser";
  const nomSaisi = texte(formData, "nom");
  const nom = nomSaisi || (type === "physique" ? rep : "");

  if (!nom) {
    redirectWithErreur("/admin/membres", "Le nom de l’entreprise est requis.");
  }

  const m = await prisma.member.create({
    data: {
      type,
      nom,
      secteur: texte(formData, "secteur") || "Secteur à préciser",
      ville: texte(formData, "ville") || "Antananarivo",
      statut: (texte(formData, "statut") || "en_attente") as MemberStatus,
      adhesion: jourBase(),
      activite: texte(formData, "desc").slice(0, 120) || "Activité à préciser.",
      desc: texte(formData, "desc") || "Description à compléter.",
    },
  });

  const email = texte(formData, "email").toLowerCase();
  let invite = false;
  if (email && !(await prisma.user.findUnique({ where: { email } }))) {
    const contact = await prisma.user.create({
      data: {
        role: "membre",
        nom: rep,
        fonction: texte(formData, "repTitre") || "Représentant(e)",
        email,
        tel: texte(formData, "tel") || null,
        memberId: m.id,
        contactPrincipal: true,
      },
    });
    await inviter(contact.id, email, rep, type === "morale" ? nom : null);
    invite = true;
  }

  await journal(
    "membre_cree",
    "Member",
    m.id,
    await acteurEquipe(),
    `Ajout manuel de ${nom}.`,
  );
  revalideTout();
  redirectWithFlash(
    `/admin/membres/${m.id}`,
    invite
      ? `${nom} a été ajouté à l’annuaire · invitation envoyée à ${email}`
      : `${nom} a été ajouté à l’annuaire`,
  );
}

/** Mise à jour de la fiche par le membre lui-même. */
/**
 * Fiche de présentation : textes, couverture et logo.
 *
 * Les produits et services n'y figurent plus. Ils se gèrent un par un depuis
 * leur section — l'ancien formulaire les supprimait et les recréait tous à
 * chaque enregistrement, ce qui aurait effacé descriptions et prix qu'il ne
 * connaissait pas.
 */
export async function updateMemberProfile(formData: FormData) {
  // L'identifiant reçu ne fait pas foi : un membre ne modifie que sa fiche.
  const retour = retourInterne(formData, "/membre/profil");
  const { memberId: id } = await exigerFiche(
    texte(formData, "memberId"),
    retour,
  );

  // Un champ fichier laissé vide signifie « garde l'image actuelle ».
  const actuel = await prisma.member.findUnique({
    where: { id },
    select: { cover: true, logo: true },
  });
  if (!actuel) redirectWithErreur("/membre/profil", "Fiche introuvable.");

  const siteSaisi = texte(formData, "siteweb");
  const siteweb = normaliserSite(siteSaisi);
  if (siteSaisi && !siteweb) {
    redirectWithErreur(
      "/membre/profil",
      `« ${siteSaisi} » n’est pas une adresse de site valide.`,
    );
  }

  let couverture: string | null = null;
  let logo: string | null = null;
  try {
    couverture = await enregistrerImage(formData.get("cover"), {
      prefixe: `couverture-${id}`,
      largeur: 1600,
    });
    logo = await enregistrerImage(formData.get("logo"), {
      prefixe: `logo-${id}`,
      largeur: 600,
      transparence: true,
    });
  } catch (e) {
    if (e instanceof ImageRefusee)
      redirectWithErreur("/membre/profil", e.message);
    throw e;
  }

  await prisma.member.update({
    where: { id },
    data: {
      activite: texte(formData, "activite") || undefined,
      desc: texte(formData, "desc") || undefined,
      // Besoins et intérêts ne font plus qu'un champ : le formulaire reprend
      // les intérêts à la suite des besoins, ils sont donc enregistrés là.
      besoins: texte(formData, "besoins") || null,
      interets: null,
      siteweb,
      cover: couverture ?? actuel.cover,
      logo: logo ?? actuel.logo,
    },
  });

  revalideTout();
  redirectWithFlash("/membre/profil", "Fiche mise à jour");
}

/* ============================ Produits & services ============================ */

/** Photos envoyées, redimensionnées, dans la limite de la place restante. */
async function recevoirPhotos(
  formData: FormData,
  memberId: string,
  place: number,
): Promise<string[]> {
  const urls: string[] = [];
  for (const fichier of formData.getAll("photos")) {
    if (urls.length >= place) break;
    const url = await enregistrerImage(fichier, {
      prefixe: `produit-${memberId}`,
      largeur: 900,
    });
    if (url) urls.push(url);
  }
  return urls;
}

function champsService(formData: FormData) {
  return {
    label: texte(formData, "label"),
    type: (texte(formData, "type") === "produit" ? "produit" : "service") as
      "produit" | "service",
    description: texte(formData, "description") || null,
    prix: texte(formData, "prix") || null,
  };
}

export async function ajouterService(formData: FormData) {
  const { memberId } = await exigerFiche(
    texte(formData, "memberId"),
    retourInterne(formData, "/membre/profil"),
  );
  const champs = champsService(formData);
  if (!champs.label)
    redirectWithErreur("/membre/profil", "Le titre est obligatoire.");

  let photos: string[] = [];
  try {
    photos = await recevoirPhotos(formData, memberId, PHOTOS_PAR_PRODUIT);
  } catch (e) {
    if (e instanceof ImageRefusee)
      redirectWithErreur("/membre/profil", e.message);
    throw e;
  }

  // Le nouveau venu se range en fin de catalogue.
  const dernier = await prisma.produit.aggregate({
    where: { memberId },
    _max: { ordre: true },
  });

  await prisma.produit.create({
    data: {
      ...champs,
      photos,
      memberId,
      ordre: (dernier._max.ordre ?? -1) + 1,
    },
  });

  revalideTout();
  redirectWithFlash(
    "/membre/profil",
    `« ${champs.label} » ajouté au catalogue.`,
  );
}

export async function modifierService(formData: FormData) {
  const id = texte(formData, "produitId");
  await exigerProduit(id, retourInterne(formData, "/membre/profil"));
  const champs = champsService(formData);
  if (!champs.label)
    redirectWithErreur("/membre/profil", "Le titre est obligatoire.");

  const actuel = await prisma.produit.findUnique({ where: { id } });
  if (!actuel) redirectWithErreur("/membre/profil", "Offre introuvable.");

  // On garde ce qui n'a pas été marqué pour retrait, puis on ajoute les
  // nouvelles photos à la suite : la vignette ne change que si la première
  // photo est retirée.
  const retirees = new Set(formData.getAll("retirer").map(String));
  const conservees = actuel.photos.filter((url) => !retirees.has(url));

  let ajoutees: string[] = [];
  try {
    ajoutees = await recevoirPhotos(
      formData,
      actuel.memberId,
      PHOTOS_PAR_PRODUIT - conservees.length,
    );
  } catch (e) {
    if (e instanceof ImageRefusee)
      redirectWithErreur("/membre/profil", e.message);
    throw e;
  }

  await prisma.produit.update({
    where: { id },
    data: { ...champs, photos: [...conservees, ...ajoutees] },
  });

  revalideTout();
  redirectWithFlash("/membre/profil", `« ${champs.label} » mis à jour.`);
}

export async function supprimerService(formData: FormData) {
  const id = texte(formData, "produitId");
  await exigerProduit(id, retourInterne(formData, "/membre/profil"));
  const actuel = await prisma.produit.findUnique({
    where: { id },
    select: { label: true },
  });
  if (!actuel) redirectWithErreur("/membre/profil", "Offre introuvable.");

  await prisma.produit.delete({ where: { id } });

  revalideTout();
  redirectWithFlash(
    "/membre/profil",
    `« ${actuel.label} » retiré du catalogue.`,
  );
}

export async function deleteMember(formData: FormData) {
  await exigerEquipe();
  const id = texte(formData, "memberId");
  const m = await prisma.member.findUnique({
    where: { id },
    select: { nom: true, _count: { select: { factures: true } } },
  });
  if (!m) redirectWithErreur("/admin/membres", "Membre introuvable.");

  // Les factures sont des pièces comptables : la base refuse de les perdre
  // avec le membre. On le dit avant d'essayer, et avant d'écrire au journal
  // une suppression qui n'aurait pas lieu.
  const n = m._count.factures;
  if (n > 0) {
    redirectWithErreur(
      `/admin/membres/${id}`,
      `${m.nom} a ${n} facture${n > 1 ? "s" : ""} : un membre qui a des pièces comptables ne se supprime pas.`,
    );
  }

  await journal(
    "membre_supprime",
    "Member",
    id,
    await acteurEquipe(),
    `Suppression de ${m.nom} et de ses accès.`,
  );
  await prisma.member.delete({ where: { id } });
  revalideTout();
  redirectWithFlash("/admin/membres", `${m.nom} a été retiré de l’annuaire`);
}

/* ============================ Contacts ============================ */

/**
 * Ajout d'une personne à joindre chez un membre.
 *
 * L'adresse est unique en base — c'est elle qui servira d'identifiant de
 * connexion le jour où l'authentification arrivera. On le vérifie avant
 * d'écrire pour renvoyer un message lisible plutôt qu'une erreur de contrainte.
 */
export async function addContact(formData: FormData) {
  const retour = retourInterne(formData, "/membre/profil");
  const { memberId } = await exigerFiche(texte(formData, "memberId"), retour);
  const nom = texte(formData, "nom");
  const email = texte(formData, "email").toLowerCase();

  if (!nom || !email) {
    redirectWithErreur(retour, "Nom et courriel sont obligatoires.");
  }

  const occupe = await prisma.user.findUnique({ where: { email } });
  if (occupe) {
    redirectWithErreur(
      retour,
      `Le courriel ${email} est déjà rattaché à un contact.`,
    );
  }

  const principal = formData.get("principal") === "on";

  let photo: string | null = null;
  try {
    photo = await enregistrerImage(formData.get("photo"), {
      prefixe: `contact-${memberId}`,
      largeur: 400,
    });
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithErreur(retour, e.message);
    throw e;
  }

  const cree = await prisma.$transaction(async (tx) => {
    // Un seul référent par entreprise : le nouveau détrône l'ancien.
    if (principal) {
      await tx.user.updateMany({
        where: { memberId },
        data: { contactPrincipal: false },
      });
    }
    return tx.user.create({
      data: {
        memberId,
        role: "membre",
        nom,
        fonction: texte(formData, "fonction") || "Contact",
        email,
        tel: texte(formData, "tel") || null,
        photo,
        contactPrincipal: principal,
      },
    });
  });

  const entreprise = await prisma.member.findUnique({
    where: { id: memberId },
    select: { nom: true, type: true },
  });
  await inviter(
    cree.id,
    email,
    nom,
    entreprise?.type === "morale" ? entreprise.nom : null,
  );

  await journal(
    "contact_ajoute",
    "Member",
    memberId,
    await acteurDepuis(retour),
    `Ajout du contact ${nom} (${email}), invité à choisir son mot de passe.`,
  );
  revalideTout();
  redirectWithFlash(
    retour,
    `${nom} a été ajouté aux contacts · invitation envoyée`,
  );
}

/** Retrait d'un contact. Le dernier de la liste ne peut pas être retiré. */
export async function removeContact(formData: FormData) {
  const id = texte(formData, "contactId");
  const retour = retourInterne(formData, "/membre/profil");
  await exigerContact(id, retour);

  const contact = await prisma.user.findUnique({ where: { id } });
  if (!contact?.memberId) redirectWithErreur(retour, "Contact introuvable.");

  const reste = await prisma.user.count({
    where: { memberId: contact.memberId },
  });
  if (reste <= 1) {
    redirectWithErreur(
      retour,
      "Une entreprise doit garder au moins un contact.",
    );
  }

  await prisma.user.delete({ where: { id } });

  // Le référent part sans remplaçant désigné : le plus ancien reprend le rôle.
  if (contact.contactPrincipal) {
    const suivant = await prisma.user.findFirst({
      where: { memberId: contact.memberId },
      orderBy: { createdAt: "asc" },
    });
    if (suivant) {
      await prisma.user.update({
        where: { id: suivant.id },
        data: { contactPrincipal: true },
      });
    }
  }

  await journal(
    "contact_retire",
    "Member",
    contact.memberId,
    await acteurDepuis(retour),
    `Retrait du contact ${contact.nom} (${contact.email}).`,
  );
  revalideTout();
  redirectWithFlash(retour, `${contact.nom} a été retiré des contacts.`);
}

/**
 * Modification d'un contact, portrait compris.
 *
 * L'unicité du courriel se vérifie en excluant la personne elle-même, sans quoi
 * réenregistrer une fiche sans toucher à l'adresse serait refusé.
 */
export async function updateContact(formData: FormData) {
  const id = texte(formData, "contactId");
  const retour = retourInterne(formData, "/membre/profil");
  await exigerContact(id, retour);
  const email = texte(formData, "email").toLowerCase();
  const nom = texte(formData, "nom");

  const actuel = await prisma.user.findUnique({ where: { id } });
  if (!actuel) redirectWithErreur(retour, "Contact introuvable.");
  if (!nom || !email) {
    redirectWithErreur(retour, "Nom et courriel sont obligatoires.");
  }

  const occupe = await prisma.user.findFirst({
    where: { email, id: { not: id } },
  });
  if (occupe) {
    redirectWithErreur(
      retour,
      `Le courriel ${email} est déjà rattaché à un contact.`,
    );
  }

  let photo: string | null = null;
  try {
    photo = await enregistrerImage(formData.get("photo"), {
      prefixe: `contact-${actuel.memberId ?? id}`,
      largeur: 400,
    });
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithErreur(retour, e.message);
    throw e;
  }

  const principal = formData.get("principal") === "on";

  await prisma.$transaction(async (tx) => {
    // Un seul référent par entreprise : la règle est métier, aucun index ne la
    // tient. On dégrade les autres dans la même transaction.
    if (principal && actuel.memberId) {
      await tx.user.updateMany({
        where: { memberId: actuel.memberId, id: { not: id } },
        data: { contactPrincipal: false },
      });
    }
    await tx.user.update({
      where: { id },
      data: {
        nom,
        fonction: texte(formData, "fonction") || "Contact",
        email,
        tel: texte(formData, "tel") || null,
        // Champ fichier vide : on garde le portrait en place.
        photo: photo ?? actuel.photo,
        // Le dernier référent ne peut pas se destituer lui-même : l'entreprise
        // se retrouverait sans personne à appeler en premier.
        contactPrincipal: principal || actuel.contactPrincipal,
      },
    });
  });

  revalideTout();
  redirectWithFlash(retour, `${nom} a été mis à jour.`);
}
