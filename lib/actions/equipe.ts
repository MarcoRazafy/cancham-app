"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { redirectWithFlash } from "@/lib/flash";
import { getCurrentUser } from "@/lib/session";
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
    redirectWithFlash(retour, "Le nom et la fonction sont obligatoires.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirectWithFlash(retour, "Indiquez une adresse e-mail valide.");
  }
  // L'adresse servira d'identifiant de connexion : elle est unique.
  const pris = await prisma.user.findFirst({
    where: { email, id: { not: user.id } },
    select: { id: true },
  });
  if (pris) {
    redirectWithFlash(
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
    if (e instanceof ImageRefusee) redirectWithFlash(retour, e.message);
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
 * Il n'y a pas d'invitation par courriel : un collaborateur de la chambre
 * s'inscrit comme tout le monde depuis l'espace public, puis l'équipe le
 * reconnaît et le promeut. L'inverse existe aussi — retirer l'accès à
 * quelqu'un qui quitte la chambre.
 *
 * Deux garde-fous : on ne se retire pas soi-même, et la plateforme garde au
 * moins un administrateur.
 */

const EQUIPE = "/admin/equipe";

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

/** Promotion d'un compte en administrateur. */
export async function promouvoirAdmin(formData: FormData) {
  const acteur = await getCurrentUser("admin");
  const userId = texte(formData, "userId");

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
  if (!u) redirectWithFlash(EQUIPE, "Compte introuvable.");
  if (u.role === "admin") {
    redirectWithFlash(EQUIPE, `${u.nom} est déjà administrateur.`);
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
      contactPrincipal: false,
      ...(supprimer ? { memberId: null } : {}),
    },
  });
  if (supprimer && fiche) {
    await prisma.member.delete({ where: { id: fiche.id } });
  }

  await journal(
    "admin_promu",
    userId,
    acteur.nom,
    `${u.nom} (${u.email})${
      supprimer && fiche ? ` · fiche « ${fiche.nom} » supprimée` : ""
    }.`,
  );
  revalidatePath("/", "layout");
  redirectWithFlash(
    EQUIPE,
    `${u.nom} est désormais administrateur${
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
  const acteur = await getCurrentUser("admin");
  const userId = texte(formData, "userId");

  if (userId === acteur.id) {
    redirectWithFlash(
      EQUIPE,
      "Vous ne pouvez pas retirer votre propre accès : demandez-le à un autre administrateur.",
    );
  }

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nom: true, email: true, role: true, memberId: true },
  });
  if (!u || u.role !== "admin") {
    redirectWithFlash(EQUIPE, "Ce compte n’est pas administrateur.");
  }

  const restants = await prisma.user.count({ where: { role: "admin" } });
  if (restants <= 1) {
    redirectWithFlash(
      EQUIPE,
      "Il faut au moins un administrateur : promouvez quelqu’un d’abord.",
    );
  }

  const role = u.memberId ? ("membre" as const) : ("visiteur" as const);
  await prisma.user.update({ where: { id: userId }, data: { role } });

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
    `${u.nom} n’est plus administrateur${
      role === "membre"
        ? " · son compte membre reste actif"
        : " · son compte n’a plus accès à la plateforme"
    }`,
  );
}
