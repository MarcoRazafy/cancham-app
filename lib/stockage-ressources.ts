import { execFile } from "node:child_process";
import { mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

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

export const RACINE = path.join(process.cwd(), "stockage", "ressources");

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
