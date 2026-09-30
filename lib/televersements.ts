import "server-only";
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import {
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { sessionCourante } from "@/lib/auth";
import { PLAFOND_FICHIER } from "@/lib/plafonds";
import { dossierStockage } from "@/lib/stockage";

/**
 * Les fichiers envoyés d'avance, avant le formulaire qui les emploie.
 *
 * Une photo — ou une vidéo de ressource — part dès qu'on la choisit, par la
 * route `/api/televersements`, pour que l'écran puisse suivre l'envoi et en
 * montrer le pourcentage : un formulaire envoyé d'un bloc, lui, ne dit rien
 * de sa progression. Le fichier attend ici, hors de `public/`, sous un jeton
 * que le formulaire renvoie à sa place.
 *
 * Un jeton ne sert qu'une fois, qu'à la personne qui a envoyé le fichier,
 * et pas au-delà d'une journée : ce qui n'a pas été repris part au ménage.
 */

const DOSSIER = dossierStockage("televersements-en-cours");
const DUREE_DE_VIE = 24 * 60 * 60 * 1000;
const PREFIXE = "televersement:";
const IDENTIFIANT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface Fiche {
  userId: string;
  nom: string;
  type: string;
  taille: number;
  creeLe: number;
}

export class EnvoiRefuse extends Error {}

/**
 * Reçoit un fichier, lu au fil de l'eau sans le charger en mémoire, et
 * renvoie son jeton. Au-delà du plafond, l'envoi est coupé et rien ne reste.
 */
export async function recevoirEnvoi(
  corps: ReadableStream<Uint8Array>,
  entete: { userId: string; nom: string; type: string },
): Promise<string> {
  await mkdir(DOSSIER, { recursive: true });
  void menage();

  const id = randomUUID();
  const chemin = path.join(DOSSIER, id);
  const sortie = createWriteStream(chemin);
  let taille = 0;
  try {
    const lecteur = corps.getReader();
    for (;;) {
      const { done, value } = await lecteur.read();
      if (done) break;
      taille += value.byteLength;
      if (taille > PLAFOND_FICHIER) {
        await lecteur.cancel();
        throw new EnvoiRefuse("Le fichier dépasse le plafond autorisé.");
      }
      if (!sortie.write(value)) {
        await new Promise<void>((ok) => sortie.once("drain", () => ok()));
      }
    }
    await new Promise<void>((ok, ko) =>
      sortie.end((e?: Error | null) => (e ? ko(e) : ok())),
    );
  } catch (e) {
    sortie.destroy();
    await rm(chemin, { force: true });
    throw e;
  }
  if (!taille) {
    await rm(chemin, { force: true });
    throw new EnvoiRefuse("Le fichier est vide.");
  }

  const fiche: Fiche = { ...entete, taille, creeLe: Date.now() };
  await writeFile(`${chemin}.json`, JSON.stringify(fiche));
  return `${PREFIXE}${id}`;
}

/**
 * Le fichier d'un champ de formulaire : celui qu'il contient, ou celui
 * qu'un jeton désigne — repris une seule fois, et seulement par qui l'a
 * envoyé. `null` pour un champ vide ou un jeton qui ne vaut rien.
 */
export async function fichierRecu(
  entree: FormDataEntryValue | null,
): Promise<File | null> {
  if (entree instanceof File) return entree.size > 0 ? entree : null;
  if (typeof entree !== "string" || !entree.startsWith(PREFIXE)) return null;

  const id = entree.slice(PREFIXE.length);
  if (!IDENTIFIANT.test(id)) return null;
  const chemin = path.join(DOSSIER, id);

  let fiche: Fiche;
  try {
    fiche = JSON.parse(await readFile(`${chemin}.json`, "utf8")) as Fiche;
  } catch {
    return null;
  }
  const session = await sessionCourante();
  if (!session || session.userId !== fiche.userId) return null;
  if (Date.now() - fiche.creeLe > DUREE_DE_VIE) {
    await effacer(id);
    return null;
  }

  const octets = await readFile(chemin);
  await effacer(id);
  return new File([new Uint8Array(octets)], fiche.nom, { type: fiche.type });
}

/** Tous les fichiers d'un champ multiple, dans l'ordre du formulaire. */
export async function fichiersRecus(
  entrees: FormDataEntryValue[],
): Promise<File[]> {
  const fichiers: File[] = [];
  for (const entree of entrees) {
    const f = await fichierRecu(entree);
    if (f) fichiers.push(f);
  }
  return fichiers;
}

async function effacer(id: string) {
  await rm(path.join(DOSSIER, id), { force: true });
  await rm(path.join(DOSSIER, `${id}.json`), { force: true });
}

/** Ce qu'aucun formulaire n'est venu reprendre dans la journée s'en va. */
async function menage() {
  try {
    for (const nom of await readdir(DOSSIER)) {
      const chemin = path.join(DOSSIER, nom);
      if (Date.now() - (await stat(chemin)).mtimeMs > DUREE_DE_VIE) {
        await rm(chemin, { force: true });
      }
    }
  } catch {
    // Le ménage est une commodité : son échec ne doit rien empêcher.
  }
}
