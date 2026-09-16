import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { ENTETES_PROTEGES, verifierAcces } from "@/lib/acces-ressources";
import { cheminFichier, existe } from "@/lib/stockage-ressources";

/**
 * Flux d'une vidéo, servi par morceaux.
 *
 * Les requêtes `Range` sont indispensables : sans elles, le lecteur ne peut
 * ni avancer ni reculer dans la vidéo, et le navigateur la télécharge d'un
 * bloc avant de la lire. Chaque morceau repasse par le contrôle d'accès.
 */
export async function GET(
  requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const acces = await verifierAcces(id);
  if (!acces.ok) return new Response(acces.message, { status: acces.statut });

  const chemin = cheminFichier(id, acces.ressource.fichier);
  if (!(await existe(chemin)))
    return new Response("Vidéo introuvable.", { status: 404 });

  const { size } = await stat(chemin);
  const plage = requete.headers.get("range");

  const entetes: Record<string, string> = {
    ...ENTETES_PROTEGES,
    "Content-Type": "video/mp4",
    "Accept-Ranges": "bytes",
  };

  if (!plage) {
    const flux = Readable.toWeb(createReadStream(chemin)) as ReadableStream;
    return new Response(flux, {
      headers: { ...entetes, "Content-Length": String(size) },
    });
  }

  const m = /bytes=(\d*)-(\d*)/.exec(plage);
  const debut = m?.[1] ? Number(m[1]) : 0;
  // Morceaux d'un mégaoctet au plus : assez pour une lecture fluide, sans
  // livrer le fichier entier à la première requête.
  const fin = Math.min(
    m?.[2] ? Number(m[2]) : debut + 1024 * 1024 - 1,
    size - 1,
  );

  if (debut >= size || debut > fin) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${size}` },
    });
  }

  const flux = Readable.toWeb(
    createReadStream(chemin, { start: debut, end: fin }),
  ) as ReadableStream;
  return new Response(flux, {
    status: 206,
    headers: {
      ...entetes,
      "Content-Range": `bytes ${debut}-${fin}/${size}`,
      "Content-Length": String(fin - debut + 1),
    },
  });
}
