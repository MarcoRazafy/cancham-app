import "server-only";

import { prisma } from "@/lib/db";
import { PHOTOS_PAR_PRODUIT } from "@/lib/membership";
import { enregistrerImage } from "@/lib/uploads";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export function champsProduit(formData: FormData) {
  return {
    label: texte(formData, "label"),
    type: (texte(formData, "type") === "produit" ? "produit" : "service") as
      "produit" | "service",
    description: texte(formData, "description") || null,
    prix: texte(formData, "prix") || null,
  };
}

export async function recevoirPhotosProduit(
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

export async function creerProduit(
  formData: FormData,
  memberId: string,
): Promise<string | null> {
  const champs = champsProduit(formData);
  if (!champs.label) return null;
  const photos = await recevoirPhotosProduit(
    formData,
    memberId,
    PHOTOS_PAR_PRODUIT,
  );
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
  return champs.label;
}
