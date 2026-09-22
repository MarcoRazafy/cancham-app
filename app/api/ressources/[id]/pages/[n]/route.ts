import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { ENTETES_PROTEGES, verifierAcces } from "@/lib/acces-ressources";
import { FILIGRANE } from "@/lib/coordonnees";
import { cheminPage, existe } from "@/lib/stockage-ressources";

/**
 * Une page de document, rendue en image et filigranée à la marque CanCham.
 *
 * Le filigrane est incrusté dans les pixels, côté serveur : il ne se retire
 * pas en supprimant un élément de la page. Il n'empêche pas une capture
 * d'écran — rien ne le peut —, mais toute copie porte la marque de la
 * chambre.
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

  const texte = echapper(FILIGRANE);

  // La marque en quinconce, sur des diagonales qui débordent la page de
  // chaque côté : inclinées, elles doivent encore couvrir les quatre coins.
  const PAS_X = 280;
  const PAS_Y = 150;
  const marge = Math.ceil((width * 0.6) / PAS_Y);
  const lignes = Array.from(
    { length: Math.ceil(height / PAS_Y) + 2 * marge + 1 },
    (_, i) => {
      const y = (i - marge) * PAS_Y;
      const decalage = i % 2 ? PAS_X / 2 : 0;
      const textes = Array.from(
        { length: Math.ceil((width * 2) / PAS_X) + 1 },
        (_, j) =>
          `<text x="${-width / 2 + decalage + j * PAS_X}" y="${y}">${texte}</text>`,
      ).join("");
      return `<g transform="rotate(-28 ${width / 2} ${y})">${textes}</g>`;
    },
  ).join("");

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
