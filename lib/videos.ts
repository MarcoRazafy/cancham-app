import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import {
  appendFile,
  mkdir,
  open,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { dossierStockage } from "@/lib/stockage";
import {
  estNomVideo,
  formatVideo,
  MORCEAU_VIDEO,
  nomVideo,
  PLAFOND_VIDEO,
  signatureVideo,
  type FormatVideo,
} from "@/lib/video-presentation";

const DOSSIER = dossierStockage("videos");
const EN_COURS = dossierStockage("videos-en-cours");
const DUREE_DE_VIE = 24 * 60 * 60 * 1000;
const IDENTIFIANT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface Envoi {
  userId: string;
  memberId: string;
  format: FormatVideo;
  taille: number;
  creeLe: number;
}

export class VideoRefusee extends Error {
  constructor(
    message: string,
    readonly statut = 400,
  ) {
    super(message);
  }
}

export class Decalage extends Error {
  constructor(readonly recu: number) {
    super("Le morceau ne commence pas où le fichier s’arrête.");
  }
}

const partie = (id: string) => path.join(EN_COURS, `${id}.part`);
const fiche = (id: string) => path.join(EN_COURS, `${id}.json`);

async function lireEnvoi(id: string, userId: string): Promise<Envoi> {
  if (!IDENTIFIANT.test(id)) throw new VideoRefusee("Envoi introuvable.", 404);
  let envoi: Envoi;
  try {
    envoi = JSON.parse(await readFile(fiche(id), "utf8")) as Envoi;
  } catch {
    throw new VideoRefusee(
      "Cet envoi n’existe plus : relancez l’envoi de la vidéo.",
      404,
    );
  }
  if (envoi.userId !== userId) {
    throw new VideoRefusee("Envoi introuvable.", 404);
  }
  return envoi;
}

async function effacer(id: string) {
  await rm(partie(id), { force: true });
  await rm(fiche(id), { force: true });
}

async function menage(userId: string, memberId: string) {
  let noms: string[];
  try {
    noms = await readdir(EN_COURS);
  } catch {
    return;
  }
  for (const nom of noms) {
    if (!nom.endsWith(".json")) continue;
    const id = nom.slice(0, -5);
    try {
      const envoi = JSON.parse(await readFile(fiche(id), "utf8")) as Envoi;
      const perime = Date.now() - envoi.creeLe > DUREE_DE_VIE;
      const remplace = envoi.userId === userId && envoi.memberId === memberId;
      if (perime || remplace) await effacer(id);
    } catch {
      await effacer(id);
    }
  }
}

export async function ouvrirEnvoi(demande: {
  userId: string;
  memberId: string;
  nom: string;
  taille: number;
}): Promise<string> {
  const format = formatVideo(demande.nom);
  if (!format) {
    throw new VideoRefusee(
      "Format non pris en charge : envoyez une vidéo MP4, WebM ou MOV.",
      415,
    );
  }
  if (!Number.isSafeInteger(demande.taille) || demande.taille <= 0) {
    throw new VideoRefusee("La vidéo est vide.");
  }
  if (demande.taille > PLAFOND_VIDEO) {
    throw new VideoRefusee("La vidéo dépasse 1 Go.", 413);
  }

  await mkdir(EN_COURS, { recursive: true });
  await menage(demande.userId, demande.memberId);

  const id = randomUUID();
  const envoi: Envoi = {
    userId: demande.userId,
    memberId: demande.memberId,
    format,
    taille: demande.taille,
    creeLe: Date.now(),
  };
  await writeFile(partie(id), "");
  await writeFile(fiche(id), JSON.stringify(envoi));
  return id;
}

async function lireBorne(
  corps: ReadableStream<Uint8Array>,
  max: number,
): Promise<Buffer> {
  const lecteur = corps.getReader();
  const blocs: Uint8Array[] = [];
  let taille = 0;
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    taille += value.byteLength;
    if (taille > max) {
      await lecteur.cancel();
      throw new VideoRefusee("Le morceau dépasse ce qui était annoncé.", 413);
    }
    blocs.push(value);
  }
  return Buffer.concat(blocs, taille);
}

const files = new Map<string, Promise<unknown>>();

function chacunSonTour<T>(id: string, tache: () => Promise<T>): Promise<T> {
  const suite = (files.get(id) ?? Promise.resolve()).then(tache, tache);
  const garde = suite.catch(() => {});
  files.set(id, garde);
  void garde.then(() => {
    if (files.get(id) === garde) files.delete(id);
  });
  return suite;
}

export function recevoirMorceau(
  id: string,
  userId: string,
  position: number,
  corps: ReadableStream<Uint8Array>,
): Promise<number> {
  return chacunSonTour(id, async () => {
    const envoi = await lireEnvoi(id, userId);
    const recu = (await stat(partie(id))).size;
    if (position !== recu) throw new Decalage(recu);

    const reste = envoi.taille - recu;
    if (reste <= 0) {
      throw new VideoRefusee("La vidéo est déjà entière.", 409);
    }
    const morceau = await lireBorne(corps, Math.min(MORCEAU_VIDEO, reste));
    if (!morceau.length) throw new VideoRefusee("Morceau vide.");
    await appendFile(partie(id), morceau);
    return recu + morceau.length;
  });
}

export async function etatEnvoi(id: string, userId: string): Promise<number> {
  await lireEnvoi(id, userId);
  return (await stat(partie(id))).size;
}

export function terminerEnvoi(
  id: string,
  userId: string,
): Promise<{ memberId: string; fichier: string }> {
  return chacunSonTour(id, async () => {
    const envoi = await lireEnvoi(id, userId);
    const recu = (await stat(partie(id))).size;
    if (recu !== envoi.taille) {
      throw new VideoRefusee(
        "La vidéo n’est pas arrivée en entier : relancez l’envoi.",
        409,
      );
    }

    const debut = Buffer.alloc(12);
    const fichierOuvert = await open(partie(id), "r");
    try {
      await fichierOuvert.read(debut, 0, 12, 0);
    } finally {
      await fichierOuvert.close();
    }
    if (!signatureVideo(debut, envoi.format)) {
      await effacer(id);
      throw new VideoRefusee(
        "Ce fichier n’est pas une vidéo lisible. Exportez-la en MP4, puis réessayez.",
        415,
      );
    }

    await mkdir(DOSSIER, { recursive: true });
    const fichier = nomVideo(
      envoi.memberId,
      randomBytes(8).toString("hex"),
      envoi.format,
    );
    await rename(partie(id), path.join(DOSSIER, fichier));
    await rm(fiche(id), { force: true });
    return { memberId: envoi.memberId, fichier };
  });
}

export async function abandonnerEnvoi(id: string, userId: string) {
  await lireEnvoi(id, userId);
  await chacunSonTour(id, () => effacer(id));
}

export function cheminVideo(fichier: string): string | null {
  return estNomVideo(fichier) ? path.join(DOSSIER, fichier) : null;
}

export async function supprimerVideo(fichier: string | null | undefined) {
  const chemin = fichier ? cheminVideo(fichier) : null;
  if (chemin) await rm(chemin, { force: true });
}
