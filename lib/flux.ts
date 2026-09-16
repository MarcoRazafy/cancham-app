import "server-only";

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

/**
 * Sert un fichier du stockage privé, requêtes `Range` comprises.
 *
 * Les plages sont indispensables pour la vidéo : sans elles, le lecteur ne
 * peut ni avancer ni reculer, et le navigateur télécharge tout d'un bloc avant
 * de lire. Pour une image ou un PDF, le navigateur ne demande pas de plage et
 * reçoit le fichier entier.
 */
export async function servirFichier(
  requete: Request,
  chemin: string,
  entetes: Record<string, string>,
  /** Taille maximale d'un morceau, quand le client n'en fixe pas la fin. */
  morceau = 1024 * 1024,
): Promise<Response> {
  const { size } = await stat(chemin);
  const base = { ...entetes, "Accept-Ranges": "bytes" };
  const plage = requete.headers.get("range");

  if (!plage) {
    const flux = Readable.toWeb(createReadStream(chemin)) as ReadableStream;
    return new Response(flux, {
      headers: { ...base, "Content-Length": String(size) },
    });
  }

  const m = /bytes=(\d*)-(\d*)/.exec(plage);
  const debut = m?.[1] ? Number(m[1]) : 0;
  const fin = Math.min(m?.[2] ? Number(m[2]) : debut + morceau - 1, size - 1);

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
      ...base,
      "Content-Range": `bytes ${debut}-${fin}/${size}`,
      "Content-Length": String(fin - debut + 1),
    },
  });
}
