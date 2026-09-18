"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { espaceDe, estHeure, estJourISO } from "@/lib/agenda";
import { redirectWithFlash } from "@/lib/flash";
import { jourBase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

/**
 * Rappels personnels de l'agenda.
 *
 * Ce sont des pense-bêtes d'une personne : ils ne passent pas au journal
 * d'activité, qui trace les opérations de l'équipe, et seul leur auteur peut
 * les modifier.
 */

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

const TITRE_MAX = 120;
const NOTE_MAX = 500;

/**
 * Page de retour : celle où le rappel a été saisi — l'agenda, ou toute autre
 * page qui propose d'en ajouter. Jamais une adresse tierce.
 */
function retour(fd: FormData): string {
  const r = texte(fd, "retour");
  return /^\/(membre|admin)([/?]|$)/.test(r) ? r : "/membre/agenda";
}

/** L'espace, et donc la personne connectée, se lisent dans la page de retour. */
const utilisateur = (page: string) => getCurrentUser(espaceDe(page));

const revalider = (page: string) => {
  revalidatePath(`/${espaceDe(page)}`, "layout");
};

/** Champs d'un rappel, validés. Redirige avec le motif en cas d'erreur. */
function lireRappel(fd: FormData, page: string) {
  const titre = texte(fd, "titre");
  const note = texte(fd, "note");
  const jour = texte(fd, "jour");
  const heure = texte(fd, "journee") === "1" ? "" : texte(fd, "heure");

  if (!titre) redirectWithFlash(page, "Donnez un titre au rappel.");
  if (titre.length > TITRE_MAX) {
    redirectWithFlash(page, `Le titre tient en ${TITRE_MAX} caractères.`);
  }
  if (note.length > NOTE_MAX) {
    redirectWithFlash(page, `La note tient en ${NOTE_MAX} caractères.`);
  }
  if (!estJourISO(jour))
    redirectWithFlash(page, "Choisissez la date du rappel.");
  if (heure && !estHeure(heure)) {
    redirectWithFlash(page, "L’heure s’écrit HH:MM.");
  }

  return {
    titre,
    note: note || null,
    jour: jourBase(jour),
    heure: heure || null,
  };
}

/** Le rappel, s'il appartient à la personne connectée. */
async function rappelDe(fd: FormData, page: string) {
  const user = await utilisateur(page);
  const r = await prisma.rappel.findUnique({
    where: { id: texte(fd, "rappelId") },
    select: { id: true, userId: true, titre: true, fait: true },
  });
  if (!r || r.userId !== user.id) {
    redirectWithFlash(page, "Ce rappel n’existe plus.");
  }
  return r;
}

export async function creerRappel(formData: FormData) {
  const page = retour(formData);
  const data = lireRappel(formData, page);
  const user = await utilisateur(page);

  await prisma.rappel.create({ data: { ...data, userId: user.id } });
  revalider(page);
  redirectWithFlash(page, "Rappel ajouté à l’agenda");
}

export async function modifierRappel(formData: FormData) {
  const page = retour(formData);
  const data = lireRappel(formData, page);
  const r = await rappelDe(formData, page);

  await prisma.rappel.update({ where: { id: r.id }, data });
  revalider(page);
  redirectWithFlash(page, "Rappel mis à jour");
}

/** Coché ou décoché, sur place : pas de message pour un geste aussi simple. */
export async function basculerRappelFait(formData: FormData) {
  const page = retour(formData);
  const r = await rappelDe(formData, page);

  await prisma.rappel.update({ where: { id: r.id }, data: { fait: !r.fait } });
  revalider(page);
}

export async function supprimerRappel(formData: FormData) {
  const page = retour(formData);
  const r = await rappelDe(formData, page);

  await prisma.rappel.delete({ where: { id: r.id } });
  revalider(page);
  redirectWithFlash(page, `Rappel « ${r.titre} » supprimé`);
}
