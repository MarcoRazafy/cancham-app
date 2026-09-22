"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { courrielsActifs, envoyerCourriel, urlPublique } from "@/lib/courriel";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";
import { numeroFacture } from "@/lib/factures";
import { jourBase, jourSaisi } from "@/lib/format";
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
  courrielRelanceCotisation,
} from "@/lib/modeles-courriels";
import { enregistrerImage, ImageRefusee } from "@/lib/uploads";
import { normaliserSite } from "@/lib/liens";
import { PAYS, PROVISOIRE } from "@/lib/accueil";
import { estSecteur, secteurOuProvisoire } from "@/lib/secteurs";
import { PHOTOS_PAR_PRODUIT } from "@/lib/membership";
import {
  champsProduit,
  creerProduit,
  recevoirPhotosProduit,
} from "@/lib/produits";
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
  const base = await urlPublique("/auth/nouveau-mot-de-passe");
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
    // Vers la connexion, l'adresse déjà remplie : la première mène à la
    // suite de la fiche.
    const lien = await urlPublique(
      `/auth?${new URLSearchParams({ email: contact.email })}`,
    );
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
      secteur: secteurOuProvisoire(
        texte(formData, "secteur"),
        PROVISOIRE.secteur,
      ),
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
    select: { cover: true, logo: true, nom: true, pays: true },
  });
  if (!actuel) redirectWithErreur("/membre/profil", "Fiche introuvable.");

  const nom = texte(formData, "nom").slice(0, 120);
  if (!nom) {
    redirectWithErreur("/membre/profil", "Le nom de l’entreprise est requis.");
  }
  // Un pays de la liste, ou celui déjà enregistré ; sinon, inchangé.
  const paysSaisi = texte(formData, "pays");
  const pays =
    (PAYS as readonly string[]).includes(paysSaisi) || paysSaisi === actuel.pays
      ? paysSaisi
      : undefined;

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
      nom,
      ville: texte(formData, "ville").slice(0, 80) || undefined,
      pays,
      motivation: texte(formData, "motivation").slice(0, 1000) || null,
      // Hors de la liste — ancien libellé renvoyé tel quel, ou valeur
      // fabriquée —, le secteur ne change pas.
      secteur: estSecteur(texte(formData, "secteur"))
        ? texte(formData, "secteur")
        : undefined,
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

  // Un changement de nom se trace : les factures déjà émises portent
  // l'ancien, et l'équipe doit pouvoir faire le lien.
  if (nom !== actuel.nom) {
    await journal(
      "membre_renomme",
      "Member",
      id,
      await acteurDepuis(retour),
      `« ${actuel.nom} » devient « ${nom} ».`,
    );
  }

  revalideTout();
  redirectWithFlash("/membre/profil", "Fiche mise à jour");
}

/** Plafond de besoins sur une fiche : au-delà, la liste ne se lit plus. */
const BESOINS_MAX = 15;

/** Ajoute un besoin à la liste « Besoins & intérêts » de sa fiche. */
export async function ajouterBesoin(formData: FormData) {
  const retour = "/membre/profil";
  const { memberId } = await exigerFiche(texte(formData, "memberId"), retour);
  // Une ligne : c'est un tiret sur la fiche.
  const besoin = texte(formData, "besoin").replace(/\s+/g, " ").slice(0, 200);
  if (!besoin) redirectWithErreur(retour, "Décrivez ce que vous recherchez.");

  const m = await prisma.member.findUnique({
    where: { id: memberId },
    select: { besoins: true, interets: true },
  });
  // Besoins et intérêts ne forment qu'une liste : les intérêts d'avant y
  // sont repris, comme le fait « Modifier ma fiche ».
  const lignes = [m?.besoins, m?.interets]
    .flatMap((t) => (t ?? "").split("\n"))
    .map((l) => l.trim())
    .filter(Boolean);
  if (lignes.length >= BESOINS_MAX) {
    redirectWithErreur(
      retour,
      `${BESOINS_MAX} besoins au plus : retirez-en un depuis « Modifier ma fiche ».`,
    );
  }

  await prisma.member.update({
    where: { id: memberId },
    data: { besoins: [...lignes, besoin].join("\n"), interets: null },
  });
  revalideTout();
  redirectWithFlash(retour, "Besoin ajouté à votre fiche");
}

/* ============================ Produits & services ============================ */

export async function ajouterService(formData: FormData) {
  const retour = retourInterne(formData, "/membre/profil");
  const { memberId } = await exigerFiche(texte(formData, "memberId"), retour);
  if (!champsProduit(formData).label) {
    redirectWithErreur(retour, "Le titre est obligatoire.");
  }

  let label: string | null = null;
  try {
    label = await creerProduit(formData, memberId);
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithErreur(retour, e.message);
    throw e;
  }

  revalideTout();
  redirectWithFlash(retour, `« ${label} » ajouté au catalogue.`);
}

export async function modifierService(formData: FormData) {
  const id = texte(formData, "produitId");
  await exigerProduit(id, retourInterne(formData, "/membre/profil"));
  const champs = champsProduit(formData);
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
    ajoutees = await recevoirPhotosProduit(
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
