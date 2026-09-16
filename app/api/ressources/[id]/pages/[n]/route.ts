import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { ENTETES_PROTEGES, verifierAcces } from "@/lib/acces-ressources";
import { cheminPage, existe } from "@/lib/stockage-ressources";

/**
 * Une page de document, rendue en image et filigranée au nom du lecteur.
 *
 * Le filigrane est incrusté dans les pixels, côté serveur : il ne se retire
 * pas en supprimant un élément de la page. Il n'empêche pas une capture
 * d'écran — rien ne le peut — mais toute capture porte le nom et l'adresse de
 * la personne qui l'a faite, et une fuite se remonte jusqu'à elle.
 */
export async function GET(
  _requete: Request,
  { params }: { params: Promise<{ id: string; n: string }> },
) {
  const { id, n } = await params;
  const acces = await verifierAcces(id);
  if (!acces.ok) return new Response(acces.message, { status: acces.statut });

  const numero = Number(n);
  if (
    !Number.isInteger(numero) ||
    numero < 1 ||
    numero > (acces.ressource.pages ?? 0)
  ) {
    return new Response("Page introuvable.", { status: 404 });
  }

  const chemin = cheminPage(id, numero);
  if (!(await existe(chemin)))
    return new Response("Page introuvable.", { status: 404 });

  const source = await readFile(chemin);
  const { width = 900, height = 1270 } = await sharp(source).metadata();

  const date = new Date().toLocaleDateString("fr-FR");
  const texte = echapper(
    `${acces.lecteur.nom} · ${acces.lecteur.email} · ${date}`,
  );

  // Une ligne en diagonale, répétée sur toute la hauteur de la page.
  const lignes = Array.from({ length: Math.ceil(height / 150) + 2 }, (_, i) => {
    const y = i * 150;
    return `<text x="-40" y="${y}" transform="rotate(-28 ${width / 2} ${y})">${texte}</text>`;
  }).join("");

  const filigrane = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>text { font: 600 17px sans-serif; fill: #0f1d2c; fill-opacity: 0.11; }</style>
      ${lignes}
    </svg>`,
  );

  const image = await sharp(source)
    .composite([{ input: filigrane, top: 0, left: 0 }])
    .png({ compressionLevel: 8 })
    .toBuffer();

  return new Response(new Uint8Array(image), {
    headers: { ...ENTETES_PROTEGES, "Content-Type": "image/png" },
  });
}

function echapper(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
