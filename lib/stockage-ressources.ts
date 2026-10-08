import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  cp,
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
import { promisify } from "node:util";
import sharp from "sharp";
import { estFichierBloc } from "@/lib/blocs";
import { PLAFOND_FICHIER } from "@/lib/plafonds";
import { dossierStockage } from "@/lib/stockage";
import { envoiEnAttente } from "@/lib/televersements";
import { formatVideo, signatureVideo } from "@/lib/video-presentation";

const executer = promisify(execFile);

/**
 * Stockage privé des ressources.
 *
 * Les fichiers vivent hors de `public/` : Next y sert tout ce qui s'y trouve à
 * qui connaît l'URL, sans rien vérifier. Ici, rien n'est accessible
 * directement — chaque page, chaque seconde de vidéo passe par une route qui
 * contrôle l'accès avant de répondre.
 *
 * Un document n'est jamais envoyé tel quel au navigateur. Il est converti en
 * PDF, puis chaque page est rendue en image : le lecteur n'affiche que ces
 * images. Pas de fichier à enregistrer, pas de couche de texte à copier.
 *
 * Dépendances système : LibreOffice (`soffice`) pour les DOCX et `pdftoppm`
 * (paquet poppler-utils) pour le rendu des pages. Toutes deux présentes sur un
 * serveur Linux classique ; absentes d'un hébergement serverless, où il faudra
 * convertir au moment du dépôt sur une machine qui les a.
 */

export const RACINE = dossierStockage("ressources");

/** Dossier d'une ressource. L'identifiant est contrôlé : pas de `../`. */
export function dossierRessource(id: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error("Identifiant invalide.");
  return path.join(RACINE, id);
}

/** Chemin de la page `n` (à partir de 1) rendue en image. */
export function cheminPage(id: string, n: number): string {
  return path.join(
    dossierRessource(id),
    "pages",
    `page-${String(n).padStart(3, "0")}.png`,
  );
}

/** Chemin d'un fichier source déposé dans le dossier de la ressource. */
export function cheminFichier(id: string, fichier: string): string {
  // Le nom vient de la base, mais on ne lui fait pas confiance pour autant.
  if (
    fichier.includes("/") ||
    fichier.includes("\\") ||
    fichier.startsWith(".")
  ) {
    throw new Error("Nom de fichier invalide.");
  }
  return path.join(dossierRessource(id), fichier);
}

/**
 * Prépare un document pour la lecture : DOCX → PDF si besoin, puis une image
 * par page. Renvoie le nombre de pages rendues.
 *
 * 110 dpi : lisible à l'écran sur une largeur de 900 px, trop faible pour une
 * réimpression propre — c'est voulu, la ressource se lit ici.
 */
export async function preparerDocument(
  id: string,
  fichier: string,
): Promise<number> {
  const dossier = dossierRessource(id);
  let pdf = cheminFichier(id, fichier);

  if (/\.docx?$/i.test(fichier)) {
    await executer(
      "soffice",
      ["--headless", "--convert-to", "pdf", "--outdir", dossier, pdf],
      { timeout: 120_000 },
    );
    pdf = pdf.replace(/\.docx?$/i, ".pdf");
  }

  const sortie = path.join(dossier, "pages");
  await rm(sortie, { recursive: true, force: true });
  await mkdir(sortie, { recursive: true });

  // `-png` et un préfixe fixe : pdftoppm numérote page-01, page-02… selon le
  // nombre de pages. On renomme ensuite sur trois chiffres, stables.
  await executer(
    "pdftoppm",
    ["-png", "-r", "110", pdf, path.join(sortie, "p")],
    {
      timeout: 120_000,
    },
  );

  const rendues = (await readdir(sortie))
    .filter((f) => f.endsWith(".png"))
    .sort();
  for (const [i, f] of rendues.entries()) {
    await rename(path.join(sortie, f), cheminPage(id, i + 1));
  }
  return rendues.length;
}

/** Le fichier existe-t-il bien dans le stockage ? */
export async function existe(chemin: string): Promise<boolean> {
  try {
    return (await stat(chemin)).isFile();
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/*  Dépôt par l'équipe                                                        */
/* -------------------------------------------------------------------------- */

/** Le plafond de sécurité commun (lib/plafonds.ts). */
export const PLAFOND_RESSOURCE = PLAFOND_FICHIER;

export class FichierRefuse extends Error {}

export interface FichierRecu {
  fmt: "pdf" | "docx" | "video" | "image";
  fichier: string;
  pages: number | null;
  taille: string;
}

/** « 842 ko », « 3,4 Mo ». */
function poidsLisible(octets: number): string {
  if (octets < 1024 * 1024)
    return `${Math.max(1, Math.round(octets / 1024))} ko`;
  return `${(octets / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}

/** La signature d'une image : JPEG, PNG ou WebP, l'extension qui va avec. */
function imageDe(debut: Buffer): string | null {
  if (debut[0] === 0xff && debut[1] === 0xd8 && debut[2] === 0xff) return "jpg";
  if (debut.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])))
    return "png";
  if (
    debut.subarray(0, 4).toString("latin1") === "RIFF" &&
    debut.subarray(8, 12).toString("latin1") === "WEBP"
  )
    return "webp";
  return null;
}

/**
 * Une photo se lit comme un document d'une seule page : on la rend en PNG
 * au même emplacement que les pages, et le lecteur n'y voit pas de
 * différence. L'orientation de l'appareil est appliquée, les métadonnées —
 * coordonnées GPS comprises — ne passent pas.
 */
async function preparerPhoto(id: string, source: Buffer): Promise<number> {
  const sortie = path.join(dossierRessource(id), "pages");
  await mkdir(sortie, { recursive: true });
  await sharp(source)
    .rotate()
    .resize(1800, 1800, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 8 })
    .toFile(cheminPage(id, 1));
  return 1;
}

/**
 * La couverture d'un document ou d'une photo : sa première page, réduite.
 *
 * C'est le contenu lui-même qui illustre la carte, pas une image choisie à
 * part. Assez petite pour rester une vignette — on ne lit pas le document
 * dans sa couverture.
 */
export async function couvertureDepuisPage(id: string): Promise<Buffer> {
  return sharp(await readFile(cheminPage(id, 1)))
    .resize(800, null, { withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
}

/**
 * Reçoit le fichier d'une ressource et le prépare pour la lecture.
 *
 * Le type se juge au contenu, pas au nom : un PDF commence par `%PDF-`, un
 * DOCX est une archive ZIP, une vidéo MP4 porte `ftyp` au quatrième octet,
 * une photo sa signature JPEG, PNG ou WebP.
 * Le fichier précédent de la ressource est effacé, pages rendues comprises.
 */
export async function recevoirRessource(
  id: string,
  entree: File,
): Promise<FichierRecu> {
  if (entree.size > PLAFOND_RESSOURCE) {
    throw new FichierRefuse(
      `« ${entree.name} » dépasse ${Math.round(PLAFOND_RESSOURCE / 1024 / 1024)} Mo.`,
    );
  }
  const octets = Buffer.from(await entree.arrayBuffer());
  const debut = octets.subarray(0, 12);
  const photo = imageDe(debut);
  const nom = entree.name.toLowerCase();

  let fmt: FichierRecu["fmt"];
  let fichier: string;
  if (debut.subarray(0, 5).toString("latin1") === "%PDF-") {
    fmt = "pdf";
    fichier = "document.pdf";
  } else if (
    debut.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) &&
    nom.endsWith(".docx")
  ) {
    fmt = "docx";
    fichier = "document.docx";
  } else if (debut.subarray(4, 8).toString("latin1") === "ftyp") {
    fmt = "video";
    fichier = "video.mp4";
  } else if (photo) {
    fmt = "image";
    fichier = `image.${photo}`;
  } else {
    throw new FichierRefuse(
      `« ${entree.name} » : seuls les PDF, les documents Word (DOCX), les vidéos MP4 et les photos (JPEG, PNG, WebP) sont acceptés.`,
    );
  }

  const dossier = dossierRessource(id);
  await rm(dossier, { recursive: true, force: true });
  await mkdir(dossier, { recursive: true });
  await writeFile(cheminFichier(id, fichier), octets);

  let pages: number | null = null;
  if (fmt !== "video") {
    try {
      pages =
        fmt === "image"
          ? await preparerPhoto(id, octets)
          : await preparerDocument(id, fichier);
    } catch {
      await rm(dossier, { recursive: true, force: true });
      throw new FichierRefuse(
        `« ${entree.name} » n’a pas pu être converti pour la lecture. Vérifiez qu’il s’ouvre normalement, ou enregistrez-le en PDF.`,
      );
    }
    if (!pages) {
      await rm(dossier, { recursive: true, force: true });
      throw new FichierRefuse(
        `« ${entree.name} » ne contient aucune page lisible.`,
      );
    }
  }

  return { fmt, fichier, pages, taille: poidsLisible(octets.length) };
}

/** Efface les fichiers d'une ressource supprimée. */
export async function effacerRessource(id: string): Promise<void> {
  await rm(dossierRessource(id), { recursive: true, force: true });
}

/**
 * Recopie les fichiers d'une ressource vers une autre.
 *
 * Dupliquer une ressource dans un autre dossier ne peut pas se contenter de
 * dupliquer sa ligne : le contenu est rangé sous l'identifiant, et deux
 * lignes qui pointeraient sur le même dossier se détruiraient l'une l'autre
 * à la première suppression.
 *
 * Sans dossier source — ressource sans fichier —, il n'y a rien à copier.
 */
export async function dupliquerRessource(
  source: string,
  cible: string,
): Promise<void> {
  const depuis = dossierRessource(source);
  if (!(await existe(depuis))) return;
  await mkdir(path.dirname(dossierRessource(cible)), { recursive: true });
  await cp(depuis, dossierRessource(cible), { recursive: true });
}

/* -------------------------------------------------------------------------- */
/* Les fichiers des blocs d'une page composée                                 */
/* -------------------------------------------------------------------------- */

const dossierBlocs = (id: string) => path.join(dossierRessource(id), "blocs");

/** Chemin du fichier d'un bloc — la photo ou la vidéo d'une page composée. */
export function cheminBloc(id: string, fichier: string): string {
  // Le nom vient d'une adresse ou de la base : seul le motif de ceux qu'on
  // fabrique atteint le disque.
  if (!estFichierBloc(fichier)) throw new Error("Nom de fichier invalide.");
  return path.join(dossierBlocs(id), fichier);
}

/**
 * Range le fichier d'un bloc, envoyé d'avance sous un jeton, et rend le nom
 * qu'il porte désormais.
 *
 * Une photo est redimensionnée et recompressée en WebP — l'orientation de
 * l'appareil appliquée, les métadonnées retirées, coordonnées GPS comprises.
 * Une vidéo n'est jamais chargée en mémoire : on vérifie que son début est
 * bien celui d'une vidéo, puis on la déplace.
 */
export async function recevoirFichierBloc(
  id: string,
  genre: "photo" | "video",
  jeton: string,
): Promise<string> {
  const envoi = await envoiEnAttente(jeton);
  if (!envoi) {
    throw new FichierRefuse(
      genre === "photo"
        ? "Une photo de la page n’est pas arrivée : choisissez-la de nouveau."
        : "Une vidéo de la page n’est pas arrivée : choisissez-la de nouveau.",
    );
  }
  await mkdir(dossierBlocs(id), { recursive: true });
  const alea = randomBytes(8).toString("hex");

  try {
    if (genre === "photo") {
      const nom = `photo-${alea}.webp`;
      try {
        await sharp(envoi.chemin)
          .rotate()
          .resize(1800, 1800, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(cheminBloc(id, nom));
      } catch {
        await rm(cheminBloc(id, nom), { force: true });
        throw new FichierRefuse(
          `« ${envoi.nom} » n’est pas une image lisible. Essayez en JPEG ou en PNG.`,
        );
      }
      return nom;
    }

    const format = formatVideo(envoi.nom);
    const debut = Buffer.alloc(12);
    const ouvert = await open(envoi.chemin, "r");
    try {
      await ouvert.read(debut, 0, 12, 0);
    } finally {
      await ouvert.close();
    }
    if (!format || !signatureVideo(debut, format)) {
      throw new FichierRefuse(
        `« ${envoi.nom} » n’est pas une vidéo lisible : envoyez un fichier MP4, WebM ou MOV.`,
      );
    }
    const nom = `video-${alea}.${format}`;
    await rename(envoi.chemin, cheminBloc(id, nom));
    return nom;
  } finally {
    await envoi.oublier();
  }
}

/** Efface les fichiers de blocs que la page n'emploie plus. */
export async function menageBlocs(id: string, gardes: string[]): Promise<void> {
  let noms: string[];
  try {
    noms = await readdir(dossierBlocs(id));
  } catch {
    return;
  }
  for (const nom of noms) {
    if (!gardes.includes(nom)) {
      await rm(path.join(dossierBlocs(id), nom), { force: true });
    }
  }
}

/** La couverture d'une page composée : sa première photo, en vignette. */
export async function couvertureDepuisBloc(
  id: string,
  fichier: string,
): Promise<Buffer> {
  return (
    sharp(cheminBloc(id, fichier))
      // Une image à fond transparent se pose sur du blanc, pas sur du noir.
      .flatten({ background: "#ffffff" })
      .resize(800, null, { withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer()
  );
}
