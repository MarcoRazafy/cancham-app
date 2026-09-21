import { readFile } from "node:fs/promises";
import path from "node:path";
import { DOSSIER_TELEVERSEMENTS } from "@/lib/uploads";

/**
 * Images envoyées par les membres et l'équipe : logos, couvertures, photos de
 * produits et d'actualités, portraits.
 *
 * Elles vivent dans le stockage persistant, pas dans `public/`, et passent
 * donc par cette route. Leur nom porte un identifiant aléatoire et ne change
 * jamais : le navigateur peut les garder un an sans redemander.
 *
 * Seul un nom de fichier simple est accepté — pas de `../`, pas de
 * sous-dossier — et seules les extensions que produit `enregistrerImage`.
 */
const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _requete: Request,
  { params }: { params: Promise<{ fichier: string }> },
) {
  const { fichier } = await params;
  const extension = /^[\w-]+\.(jpg|jpeg|png|webp)$/i
    .exec(fichier)?.[1]
    ?.toLowerCase();
  if (!extension) return new Response("Introuvable.", { status: 404 });

  try {
    const contenu = await readFile(path.join(DOSSIER_TELEVERSEMENTS, fichier));
    return new Response(new Uint8Array(contenu), {
      headers: {
        "Content-Type": TYPES[extension],
        "Content-Length": String(contenu.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Introuvable.", { status: 404 });
  }
}
