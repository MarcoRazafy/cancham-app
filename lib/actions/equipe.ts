"use server";

import { revalidatePath } from "next/cache";
import { nomDepuisCourriel } from "@/lib/accueil";
import { courrielsActifs, envoyerCourriel, urlPublique } from "@/lib/courriel";
import { exigerAdministrateur } from "@/lib/autorisations";
import { rattacherEquipe } from "@/lib/fil-equipe";
import { prisma } from "@/lib/db";
import { NIVEAU_EQUIPE_LABEL } from "@/lib/enums";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";
import { courrielCompteEquipe } from "@/lib/modeles-courriels";
import { hacher, motDePasseProvisoire } from "@/lib/mots-de-passe";
import { getCurrentUser } from "@/lib/session";
import type { NiveauEquipe } from "@/lib/types";
import { ImageRefusee, enregistrerImage } from "@/lib/uploads";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/**
 * Profil de la personne de l'équipe connectée : nom, fonction, coordonnées,
 * photo. C'est sous ce nom qu'elle apparaît dans la messagerie et au journal
 * d'activité.
 */
export async function modifierProfilEquipe(formData: FormData) {
  const retour = "/admin/profil";
  const user = await getCurrentUser("admin");

  const nom = texte(formData, "nom");
  const fonction = texte(formData, "fonction");
  const email = texte(formData, "email").toLowerCase();
  const tel = texte(formData, "tel") || null;

  if (!nom || !fonction) {
    redirectWithErreur(retour, "Le nom et la fonction sont obligatoires.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirectWithErreur(retour, "Indiquez une adresse e-mail valide.");
  }
  // L'adresse servira d'identifiant de connexion : elle est unique.
  const pris = await prisma.user.findFirst({
    where: { email, id: { not: user.id } },
    select: { id: true },
  });
  if (pris) {
    redirectWithErreur(
      retour,
      `${email} est déjà utilisée par un autre compte.`,
    );
  }

  let photo: string | null = null;
  try {
    photo = await enregistrerImage(formData.get("photo"), {
      prefixe: `equipe-${user.id}`,
      largeur: 480,
    });
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithErreur(retour, e.message);
    throw e;
  }
  const retirerPhoto = texte(formData, "retirerPhoto") === "1";

  await prisma.user.update({
    where: { id: user.id },
    data: {
      nom,
      fonction,
      email,
      tel,
      ...(photo ? { photo } : retirerPhoto ? { photo: null } : {}),
    },
  });

  revalidatePath("/", "layout");
  redirectWithFlash(retour, "Profil mis à jour");
}

/* ============================ Accès au back-office ============================ */

/**
 * Qui tient le back-office.
 *
 * Deux niveaux : l'administrateur a le contrôle total ; le manager a tout,
 * sauf la gestion de l'équipe elle-même. Seul un administrateur ouvre un
 * compte d'équipe — une adresse, une fonction, un niveau, et un e-mail part
 * avec l'identifiant et un mot de passe provisoire —, promeut un compte
 * existant, change un niveau ou retire un accès.
 *
 * Deux garde-fous : on ne touche pas à son propre accès, et la plateforme
 * garde au moins un administrateur.
 */

const EQUIPE = "/admin/equipe";

/** Le niveau choisi dans le formulaire. À défaut, le moins étendu. */
function niveauSaisi(fd: FormData): NiveauEquipe {
  return texte(fd, "niveau") === "administrateur"
    ? "administrateur"
    : "manager";
}

/** « administrateur », « manager » : le niveau dans une phrase. */
const enClair = (n: NiveauEquipe) => NIVEAU_EQUIPE_LABEL[n].toLowerCase();

async function journal(
  action: string,
  userId: string,
  acteur: string,
  detail: string,
) {
  await prisma.auditLog.create({
    data: { action, entite: "User", entiteId: userId, acteur, detail },
  });
}

/**
 * Nouveau membre de l'équipe : son adresse et sa fonction suffisent. Le nom
 * se tire de l'adresse en attendant qu'il le donne dans « Mon profil ».
 *
 * L'identifiant et le mot de passe provisoire partent par e-mail, attendus
 * ici : si l'envoi échoue, le compte n'est pas gardé — personne n'en
 * connaîtrait le mot de passe. Sans service d'e-mails (en local), le compte
 * est créé et le message écrit dans le journal du serveur.
 */
export async function creerCompteEquipe(formData: FormData) {
  const acteur = await exigerAdministrateur(EQUIPE);
  const email = texte(formData, "email").toLowerCase();
  const fonction = texte(formData, "fonction").slice(0, 80);
  const niveau = niveauSaisi(formData);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirectWithErreur(EQUIPE, "Indiquez une adresse e-mail valide.");
  }
  if (!fonction) redirectWithErreur(EQUIPE, "Indiquez sa fonction.");
  const existant = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });
  if (existant) {
    redirectWithErreur(
      EQUIPE,
      existant.role === "admin"
        ? `${email} fait déjà partie de l’équipe.`
        : `${email} a déjà un compte : cherchez-le plus bas pour le promouvoir.`,
    );
  }

  const motDePasse = motDePasseProvisoire();
  const compte = await prisma.user.create({
    data: {
      role: "admin",
      niveauEquipe: niveau,
      nom: nomDepuisCourriel(email),
      fonction,
      email,
      motDePasse: hacher(motDePasse),
    },
    select: { id: true },
  });

  const envoye = await envoyerCourriel(
    courrielCompteEquipe(email, {
      fonction,
      niveau: enClair(niveau),
      motDePasse,
      lien: await urlPublique(`/auth?${new URLSearchParams({ email })}`),
    }),
  );
  if (!envoye && courrielsActifs()) {
    await prisma.user.delete({ where: { id: compte.id } });
    redirectWithErreur(
      EQUIPE,
      `L’e-mail n’a pas pu partir vers ${email} : le compte n’a pas été créé. Réessayez dans un instant.`,
    );
  }

  // Le nouveau venu rejoint les conversations d'assistance en cours : une
  // demande de membre s'adresse à l'équipe, pas à ses anciens.
  await rattacherEquipe();
  await journal(
    "equipe_ajoutee",
    compte.id,
    acteur.nom,
    `Compte d’équipe ouvert pour ${email} (${fonction}) · ${enClair(niveau)}.`,
  );
  revalidatePath("/", "layout");
  redirectWithFlash(
    EQUIPE,
    envoye
      ? `Compte ${enClair(niveau)} créé · identifiants envoyés à ${email}`
      : `Compte ${enClair(niveau)} créé · e-mails non configurés : identifiants écrits dans le journal du serveur`,
  );
}

/** Entrée d'un compte existant dans l'équipe, au niveau choisi. */
export async function promouvoirAdmin(formData: FormData) {
  const acteur = await exigerAdministrateur(EQUIPE);
  const userId = texte(formData, "userId");
  const niveau = niveauSaisi(formData);

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nom: true,
      email: true,
      role: true,
      memberId: true,
      member: {
        select: {
          id: true,
          nom: true,
          statut: true,
          _count: {
            select: {
              users: true,
              factures: true,
              inscriptions: true,
              produits: true,
            },
          },
        },
      },
    },
  });
  if (!u) redirectWithErreur(EQUIPE, "Compte introuvable.");
  if (u.role === "admin") {
    redirectWithErreur(EQUIPE, `${u.nom} fait déjà partie de l’équipe.`);
  }

  // La fiche d'entreprise créée à l'inscription n'a plus lieu d'être quand
  // l'inscrit se révèle être un collaborateur — à condition qu'elle soit
  // restée une candidature vide, rattachée à ce seul compte.
  const fiche = u.member;
  const effacable =
    fiche !== null &&
    fiche.statut === "candidature" &&
    fiche._count.users === 1 &&
    fiche._count.factures === 0 &&
    fiche._count.inscriptions === 0 &&
    fiche._count.produits === 0;
  const supprimer = texte(formData, "supprimerFiche") === "1" && effacable;

  await prisma.user.update({
    where: { id: userId },
    data: {
      role: "admin",
      niveauEquipe: niveau,
      contactPrincipal: false,
      ...(supprimer ? { memberId: null } : {}),
    },
  });
  if (supprimer && fiche) {
    await prisma.member.delete({ where: { id: fiche.id } });
  }

  await rattacherEquipe();
  await journal(
    "admin_promu",
    userId,
    acteur.nom,
    `${u.nom} (${u.email}) · ${enClair(niveau)}${
      supprimer && fiche ? ` · fiche « ${fiche.nom} » supprimée` : ""
    }.`,
  );
  revalidatePath("/", "layout");
  redirectWithFlash(
    EQUIPE,
    `${u.nom} rejoint l’équipe en tant que ${enClair(niveau)}${
      supprimer ? " · sa fiche de candidature a été supprimée" : ""
    }`,
  );
}

/**
 * Retrait de l'accès au back-office. Le compte rattaché à une entreprise
 * redevient un compte membre ; les autres n'ont plus d'espace, sans être
 * supprimés : leurs messages et leurs traces au journal restent lisibles.
 */
export async function retirerAdmin(formData: FormData) {
  const acteur = await exigerAdministrateur(EQUIPE);
  const userId = texte(formData, "userId");

  if (userId === acteur.id) {
    redirectWithErreur(
      EQUIPE,
      "Vous ne pouvez pas retirer votre propre accès : demandez-le à un autre administrateur.",
    );
  }

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nom: true, email: true, role: true, memberId: true },
  });
  if (!u || u.role !== "admin") {
    redirectWithErreur(EQUIPE, "Ce compte ne fait pas partie de l’équipe.");
  }

  const role = u.memberId ? ("membre" as const) : ("visiteur" as const);
  await prisma.user.update({
    where: { id: userId },
    data: { role, niveauEquipe: null },
  });

  await journal(
    "admin_retire",
    userId,
    acteur.nom,
    `${u.nom} (${u.email}) · ${
      role === "membre" ? "redevenu compte membre" : "compte sans accès"
    }.`,
  );
  revalidatePath("/", "layout");
  redirectWithFlash(
    EQUIPE,
    `${u.nom} ne fait plus partie de l’équipe${
      role === "membre"
        ? " · son compte membre reste actif"
        : " · son compte n’a plus accès à la plateforme"
    }`,
  );
}

/**
 * Passage d'administrateur à manager, ou l'inverse. On ne change pas son
 * propre niveau : un administrateur qui se rétrograderait par erreur ne
 * pourrait plus revenir en arrière seul.
 */
export async function changerNiveauEquipe(formData: FormData) {
  const acteur = await exigerAdministrateur(EQUIPE);
  const userId = texte(formData, "userId");
  const niveau = niveauSaisi(formData);

  if (userId === acteur.id) {
    redirectWithErreur(
      EQUIPE,
      "Vous ne pouvez pas changer votre propre niveau : demandez-le à un autre administrateur.",
    );
  }
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { nom: true, email: true, role: true, niveauEquipe: true },
  });
  if (!u || u.role !== "admin") {
    redirectWithErreur(EQUIPE, "Ce compte ne fait pas partie de l’équipe.");
  }
  if ((u.niveauEquipe ?? "manager") === niveau) {
    redirectWithFlash(EQUIPE, `${u.nom} est déjà ${enClair(niveau)}`);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { niveauEquipe: niveau },
  });
  await journal(
    "niveau_equipe_modifie",
    userId,
    acteur.nom,
    `${u.nom} (${u.email}) · désormais ${enClair(niveau)}.`,
  );
  revalidatePath("/", "layout");
  redirectWithFlash(EQUIPE, `${u.nom} est désormais ${enClair(niveau)}`);
}
