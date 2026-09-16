"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { redirectWithFlash } from "@/lib/flash";
import { FORMULES, fmtMontant, type Devise } from "@/lib/membership";
import { enregistrerImage, ImageRefusee } from "@/lib/uploads";
import { PHOTOS_PAR_PRODUIT } from "@/lib/membership";
import type { MemberStatus, MemberType } from "@/lib/types";

/**
 * Actions sur les membres et les cotisations.
 *
 * Toute opération financière ou destructrice laisse une trace dans `audit_logs` :
 * une validation de paiement ou une suppression de membre ne doit jamais
 * disparaître silencieusement.
 */

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Numéro de facture séquentiel par année, ex. CC-2026-0008. */
async function numeroFacture(date: Date): Promise<string> {
  const annee = date.getFullYear();
  const n = await prisma.invoice.count({
    where: { numero: { startsWith: `CC-${annee}-` } },
  });
  return `CC-${annee}-${String(n + 1).padStart(4, "0")}`;
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

/* ============================ Candidatures ============================ */

/** Dépôt d'une demande depuis l'espace public. */
export async function submitAdhesion(formData: FormData) {
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

  if (!nom) {
    redirectWithFlash(
      "/public/adhesion",
      "Merci d’indiquer le nom de votre entreprise ou votre nom.",
    );
  }

  const email = texte(formData, "email") || "contact@entreprise.mg";

  const membre = await prisma.member.create({
    data: {
      type,
      nom,
      secteur: texte(formData, "secteur") || "Secteur à préciser",
      ville: texte(formData, "ville") || "Antananarivo",
      statut: "candidature",
      formule,
      adhesion: new Date(),
      activite: texte(formData, "desc").slice(0, 120) || "Activité à préciser.",
      desc: texte(formData, "desc") || "Description à compléter.",
      statutJuridique: texte(formData, "statutJuridique") || null,
      pays: texte(formData, "pays") || null,
      siteweb: texte(formData, "siteweb") || null,
      motivation: texte(formData, "motivation") || "À compléter.",
    },
  });

  // Le représentant devient le contact principal de l'entreprise.
  const dejaPris = await prisma.user.findUnique({ where: { email } });
  if (!dejaPris) {
    await prisma.user.create({
      data: {
        role: "visiteur",
        nom: rep,
        fonction:
          texte(formData, "repTitre") ||
          (type === "physique" ? "Indépendant(e)" : "Représentant(e)"),
        email,
        tel: texte(formData, "tel") || null,
        memberId: membre.id,
        contactPrincipal: true,
      },
    });
  }

  await journal(
    "candidature_deposee",
    "Member",
    membre.id,
    rep,
    `Demande de ${nom}.`,
  );
  revalideTout();
  redirect(`/public/adhesion/confirmation?nom=${encodeURIComponent(nom)}`);
}

/** Approbation : la demande devient une adhésion en attente de règlement. */
export async function approveCandidature(formData: FormData) {
  const id = texte(formData, "memberId");
  const m = await prisma.member.update({
    where: { id },
    data: { statut: "en_attente" },
  });
  await journal("candidature_approuvee", "Member", id, "Équipe CanCham");
  revalideTout();
  redirectWithFlash(
    `/admin/membres/${id}`,
    `Demande approuvée pour ${m.nom} · en attente du paiement de la cotisation`,
  );
}

export async function rejectCandidature(formData: FormData) {
  const id = texte(formData, "memberId");
  const m = await prisma.member.findUnique({
    where: { id },
    select: { nom: true },
  });
  await journal(
    "candidature_refusee",
    "Member",
    id,
    "Équipe CanCham",
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
  const id = texte(formData, "memberId");
  const mode = texte(formData, "mode") || "Espèces";
  const dateSaisie = texte(formData, "date");
  const date = dateSaisie ? new Date(`${dateSaisie}T00:00:00`) : new Date();
  const note = texte(formData, "note");

  const avant = await prisma.member.findUnique({
    where: { id },
    select: { nom: true, paiementNote: true, formule: true },
  });
  if (!avant) redirectWithFlash("/admin/membres", "Membre introuvable.");

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
        paiementNote: `Payé par ${mode.toLowerCase()} · ${fmtMontant(montant, devise)} · le ${date.toLocaleDateString("fr-FR")}${note ? ` · ${note}` : ""}`,
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
        acteur: "Équipe CanCham",
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

/** Relance de cotisation. Rien n'est envoyé tant que l'e-mail n'est pas branché. */
export async function sendReminder(formData: FormData) {
  const id = texte(formData, "memberId");
  const m = await prisma.member.findUnique({
    where: { id },
    select: { nom: true, users: { select: { email: true }, take: 1 } },
  });
  const email = m?.users[0]?.email ?? "l’adresse du membre";
  await journal(
    "relance_envoyee",
    "Member",
    id,
    "Équipe CanCham",
    `Relance de cotisation pour ${m?.nom}.`,
  );
  revalideTout();
  redirectWithFlash(
    `/admin/membres/${id}`,
    `Relance consignée pour ${email} — l’envoi réel viendra avec le service d’e-mails`,
  );
}

/* ============================ Fiche membre ============================ */

export async function createMember(formData: FormData) {
  const type = (texte(formData, "type") || "morale") as MemberType;
  const rep = texte(formData, "rep") || "À préciser";
  const nomSaisi = texte(formData, "nom");
  const nom = nomSaisi || (type === "physique" ? rep : "");

  if (!nom) {
    redirectWithFlash("/admin/membres", "Le nom de l’entreprise est requis.");
  }

  const m = await prisma.member.create({
    data: {
      type,
      nom,
      secteur: texte(formData, "secteur") || "Secteur à préciser",
      ville: texte(formData, "ville") || "Antananarivo",
      statut: (texte(formData, "statut") || "en_attente") as MemberStatus,
      adhesion: new Date(),
      activite: texte(formData, "desc").slice(0, 120) || "Activité à préciser.",
      desc: texte(formData, "desc") || "Description à compléter.",
    },
  });

  const email = texte(formData, "email");
  if (email && !(await prisma.user.findUnique({ where: { email } }))) {
    await prisma.user.create({
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
  }

  await journal(
    "membre_cree",
    "Member",
    m.id,
    "Équipe CanCham",
    `Ajout manuel de ${nom}.`,
  );
  revalideTout();
  redirectWithFlash(
    `/admin/membres/${m.id}`,
    `${nom} a été ajouté à l’annuaire`,
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
  const id = texte(formData, "memberId");

  // Un champ fichier laissé vide signifie « garde l'image actuelle ».
  const actuel = await prisma.member.findUnique({
    where: { id },
    select: { cover: true, logo: true },
  });
  if (!actuel) redirectWithFlash("/membre/profil", "Fiche introuvable.");

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
    if (e instanceof ImageRefusee) redirectWithFlash("/membre/profil", e.message);
    throw e;
  }

  await prisma.member.update({
    where: { id },
    data: {
      activite: texte(formData, "activite") || undefined,
      desc: texte(formData, "desc") || undefined,
      besoins: texte(formData, "besoins") || null,
      interets: texte(formData, "interets") || null,
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
      | "produit"
      | "service",
    description: texte(formData, "description") || null,
    prix: texte(formData, "prix") || null,
  };
}

export async function ajouterService(formData: FormData) {
  const memberId = texte(formData, "memberId");
  const champs = champsService(formData);
  if (!champs.label) redirectWithFlash("/membre/profil", "Le titre est obligatoire.");

  let photos: string[] = [];
  try {
    photos = await recevoirPhotos(formData, memberId, PHOTOS_PAR_PRODUIT);
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithFlash("/membre/profil", e.message);
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
  redirectWithFlash("/membre/profil", `« ${champs.label} » ajouté au catalogue.`);
}

export async function modifierService(formData: FormData) {
  const id = texte(formData, "produitId");
  const champs = champsService(formData);
  if (!champs.label) redirectWithFlash("/membre/profil", "Le titre est obligatoire.");

  const actuel = await prisma.produit.findUnique({ where: { id } });
  if (!actuel) redirectWithFlash("/membre/profil", "Offre introuvable.");

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
    if (e instanceof ImageRefusee) redirectWithFlash("/membre/profil", e.message);
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
  const actuel = await prisma.produit.findUnique({
    where: { id },
    select: { label: true },
  });
  if (!actuel) redirectWithFlash("/membre/profil", "Offre introuvable.");

  await prisma.produit.delete({ where: { id } });

  revalideTout();
  redirectWithFlash("/membre/profil", `« ${actuel.label} » retiré du catalogue.`);
}

export async function deleteMember(formData: FormData) {
  const id = texte(formData, "memberId");
  const m = await prisma.member.findUnique({
    where: { id },
    select: { nom: true },
  });
  await journal(
    "membre_supprime",
    "Member",
    id,
    "Équipe CanCham",
    `Suppression de ${m?.nom ?? id} et de ses accès.`,
  );
  await prisma.member.delete({ where: { id } });
  revalideTout();
  redirectWithFlash(
    "/admin/membres",
    `${m?.nom ?? "Le membre"} a été retiré de l’annuaire`,
  );
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
  const memberId = texte(formData, "memberId");
  const nom = texte(formData, "nom");
  const email = texte(formData, "email").toLowerCase();
  const retour = texte(formData, "retour") || "/membre/profil";

  if (!nom || !email) {
    redirectWithFlash(retour, "Nom et courriel sont obligatoires.");
  }

  const occupe = await prisma.user.findUnique({ where: { email } });
  if (occupe) {
    redirectWithFlash(
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
    if (e instanceof ImageRefusee) redirectWithFlash(retour, e.message);
    throw e;
  }

  await prisma.$transaction(async (tx) => {
    // Un seul référent par entreprise : le nouveau détrône l'ancien.
    if (principal) {
      await tx.user.updateMany({
        where: { memberId },
        data: { contactPrincipal: false },
      });
    }
    await tx.user.create({
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

  await journal(
    "contact_ajoute",
    "Member",
    memberId,
    nom,
    `Ajout du contact ${nom} (${email}).`,
  );
  revalideTout();
  redirectWithFlash(retour, `${nom} a été ajouté aux contacts.`);
}

/** Retrait d'un contact. Le dernier de la liste ne peut pas être retiré. */
export async function removeContact(formData: FormData) {
  const id = texte(formData, "contactId");
  const retour = texte(formData, "retour") || "/membre/profil";

  const contact = await prisma.user.findUnique({ where: { id } });
  if (!contact?.memberId) redirectWithFlash(retour, "Contact introuvable.");

  const reste = await prisma.user.count({
    where: { memberId: contact.memberId },
  });
  if (reste <= 1) {
    redirectWithFlash(
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
    contact.nom,
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
  const email = texte(formData, "email").toLowerCase();
  const nom = texte(formData, "nom");
  const retour = texte(formData, "retour") || "/membre/profil";

  const actuel = await prisma.user.findUnique({ where: { id } });
  if (!actuel) redirectWithFlash(retour, "Contact introuvable.");
  if (!nom || !email) {
    redirectWithFlash(retour, "Nom et courriel sont obligatoires.");
  }

  const occupe = await prisma.user.findFirst({
    where: { email, id: { not: id } },
  });
  if (occupe) {
    redirectWithFlash(
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
    if (e instanceof ImageRefusee) redirectWithFlash(retour, e.message);
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
