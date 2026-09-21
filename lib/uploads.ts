import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { dossierStockage } from "@/lib/stockage";

/**
 * Réception des images envoyées par les membres.
 *
 * Elles sont redimensionnées et recompressées avant d'être écrites : à
 * Madagascar la bande passante est la contrainte n°1, et une photo de
 * téléphone de 4 Mo rendrait la fiche inconsultable. Rien n'est stocké en base
 * — seul le chemin public l'est.
 *
 * Les fichiers sont écrits dans le stockage persistant (`lib/stockage.ts`),
 * puis servis par la route `/televersements/[fichier]` : l'adresse enregistrée
 * en base reste `/televersements/<nom>`.
 */

/** Dossier d'écriture des images, dans le stockage persistant. */
export const DOSSIER_TELEVERSEMENTS = dossierStockage("televersements");
const DOSSIER = DOSSIER_TELEVERSEMENTS;

/** Au-delà, on refuse : c'est déjà quatre fois une photo de téléphone recadrée. */
const POIDS_MAX = 8 * 1024 * 1024;

export class ImageRefusee extends Error {}

/**
 * Enregistre une image et renvoie son chemin public.
 *
 * Renvoie `null` quand le champ est vide — un formulaire d'édition renvoie
 * toujours ses champs fichier, remplis ou non, et une absence signifie
 * « ne change pas l'image existante », pas « efface-la ».
 */
export async function enregistrerImage(
  fichier: FormDataEntryValue | null,
  options: {
    /** Préfixe lisible du nom de fichier, par exemple `couverture-m1`. */
    prefixe: string;
    /** Largeur maximale. L'image n'est jamais agrandie. */
    largeur: number;
    /**
     * Un logo garde sa transparence et part en PNG ; une photo est aplatie en
     * JPEG, bien plus léger à qualité égale.
     */
    transparence?: boolean;
  },
): Promise<string | null> {
  if (!(fichier instanceof File) || fichier.size === 0) return null;

  if (!fichier.type.startsWith("image/")) {
    throw new ImageRefusee("Le fichier envoyé n’est pas une image.");
  }
  if (fichier.size > POIDS_MAX) {
    throw new ImageRefusee("L’image dépasse 8 Mo. Réduisez-la avant l’envoi.");
  }

  const source = Buffer.from(await fichier.arrayBuffer());
  const extension = options.transparence ? "png" : "jpg";
  const nom = `${options.prefixe}-${randomUUID().slice(0, 8)}.${extension}`;

  // `rotate()` sans argument applique l'orientation EXIF : sans lui, les photos
  // prises en portrait arrivent couchées. Les métadonnées sautent au passage,
  // ce qui retire aussi les coordonnées GPS de l'appareil.
  const traitee = sharp(source)
    .rotate()
    .resize(options.largeur, null, { withoutEnlargement: true });

  const sortie = options.transparence
    ? await traitee.png({ compressionLevel: 9, palette: true }).toBuffer()
    : await traitee.jpeg({ quality: 80, mozjpeg: true }).toBuffer();

  await mkdir(DOSSIER, { recursive: true });
  await writeFile(path.join(DOSSIER, nom), sortie);

  return `/televersements/${nom}`;
}
