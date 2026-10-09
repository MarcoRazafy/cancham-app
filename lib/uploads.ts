import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PLAFOND_FICHIER, PLAFOND_FICHIER_MO } from "@/lib/plafonds";
import { dossierStockage } from "@/lib/stockage";
import { fichierRecu } from "@/lib/televersements";

export const DOSSIER_TELEVERSEMENTS = dossierStockage("televersements");
const DOSSIER = DOSSIER_TELEVERSEMENTS;

const POIDS_MAX = PLAFOND_FICHIER;

export class ImageRefusee extends Error {}

export async function enregistrerImage(
  entree: FormDataEntryValue | null,
  options: {
    prefixe: string;
    largeur: number;
    transparence?: boolean;
  },
): Promise<string | null> {
  const fichier = await fichierRecu(entree);
  if (!fichier) return null;

  if (!fichier.type.startsWith("image/")) {
    throw new ImageRefusee("Le fichier envoyé n’est pas une image.");
  }
  if (fichier.size > POIDS_MAX) {
    throw new ImageRefusee(
      `L’image dépasse ${PLAFOND_FICHIER_MO} Mo. Réduisez-la avant l’envoi.`,
    );
  }

  const source = Buffer.from(await fichier.arrayBuffer());
  const extension = options.transparence ? "png" : "jpg";
  const nom = `${options.prefixe}-${randomUUID().slice(0, 8)}.${extension}`;

  const traitee = sharp(source)
    .rotate()
    .resize(options.largeur, null, { withoutEnlargement: true });

  let sortie: Buffer;
  try {
    sortie = options.transparence
      ? await traitee.png({ compressionLevel: 9, palette: true }).toBuffer()
      : await traitee.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  } catch {
    throw new ImageRefusee(
      "Cette image est illisible, ou d’un format non pris en charge. Essayez en JPEG ou en PNG.",
    );
  }

  await mkdir(DOSSIER, { recursive: true });
  await writeFile(path.join(DOSSIER, nom), sortie);

  return `/televersements/${nom}`;
}
