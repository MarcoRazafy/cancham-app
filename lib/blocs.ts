/**
 * Les blocs d'une page de ressource composée dans la plateforme.
 *
 * Une ressource n'est pas forcément un fichier : l'équipe peut composer une
 * page, bloc après bloc — un titre, du texte mis en forme, une photo, une
 * vidéo. La page est rangée telle quelle dans `Resource.contenu`.
 *
 * Le texte mis en forme n'est jamais du HTML. L'éditeur le décrit — tel
 * passage est en gras, tel autre porte un lien — et c'est cette description
 * qu'on enregistre, puis qu'on redessine. Rien de ce qu'une personne a saisi
 * n'est donc injecté dans la page : une balise tapée dans un paragraphe
 * reste du texte.
 *
 * Sans `server-only` : l'éditeur contrôle sa saisie avec les mêmes règles que
 * le serveur, avant de l'envoyer.
 */

export type Taille = "petit" | "grand" | "tres-grand";
export type Alignement = "centre" | "droite";

/** Un passage de texte et sa mise en forme. `\n` : retour à la ligne. */
export interface Passage {
  t: string;
  /** Gras. */
  g?: true;
  /** Italique. */
  i?: true;
  /** Souligné. */
  s?: true;
  lien?: string;
  /** Couleur, en `#rrggbb`. */
  couleur?: string;
  taille?: Taille;
}

export type Ligne =
  | { genre: "p"; passages: Passage[]; alignement?: Alignement }
  | { genre: "ul" | "ol"; items: Passage[][] };

export interface BlocTitre {
  type: "titre";
  texte: string;
  niveau: 2 | 3;
  alignement?: Alignement;
  /** Couleur du titre entier, en `#rrggbb`. */
  couleur?: string;
}
export interface BlocTexte {
  type: "texte";
  lignes: Ligne[];
}
export interface BlocPhoto {
  type: "photo";
  /** Le fichier rangé avec la ressource — ou, à la saisie, le jeton d'envoi. */
  fichier: string;
  legende?: string;
}
export type BlocVideo =
  | { type: "video"; source: "fichier"; fichier: string }
  | { type: "video"; source: "lien"; url: string };

export type Bloc = BlocTitre | BlocTexte | BlocPhoto | BlocVideo;
export type TypeBloc = Bloc["type"];

/** Une page ne dépasse pas ce nombre de blocs. */
export const PLAFOND_BLOCS = 80;
/** Ni un bloc de texte ce nombre de caractères. */
export const PLAFOND_TEXTE = 30000;

/** Les couleurs de la charte, proposées d'abord dans l'éditeur. */
export const PALETTE_TEXTE = [
  { nom: "Rouge CanCham", valeur: "#ad0707" },
  { nom: "Vert CanCham", valeur: "#007140" },
  { nom: "Bleu nuit", valeur: "#0f1d2c" },
  { nom: "Bleu", valeur: "#163254" },
  { nom: "Rouge clair", valeur: "#d32020" },
  { nom: "Vert clair", valeur: "#14a05f" },
  { nom: "Gris", valeur: "#5f6b7a" },
] as const;

export const TAILLES: { valeur: Taille | ""; nom: string }[] = [
  { valeur: "petit", nom: "Petit" },
  { valeur: "", nom: "Normal" },
  { valeur: "grand", nom: "Grand" },
  { valeur: "tres-grand", nom: "Très grand" },
];

const JETON =
  /^televersement:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const NOM_PHOTO = /^photo-[0-9a-f]{16}\.webp$/;
const NOM_VIDEO = /^video-[0-9a-f]{16}\.(mp4|webm|mov)$/;
const COULEUR = /^#[0-9a-f]{6}$/;

/** Le fichier d'un bloc vient d'être envoyé : il attend encore sous son jeton. */
export function estJeton(fichier: string): boolean {
  return JETON.test(fichier);
}

/**
 * Vrai pour un nom que la plateforme a elle-même donné au fichier d'un bloc.
 * Tout ce qui vient d'une adresse ou d'un formulaire passe par ici avant de
 * toucher au disque : ni barre oblique, ni « .. », rien d'autre que ce motif.
 */
export function estFichierBloc(nom: string): boolean {
  return NOM_PHOTO.test(nom) || NOM_VIDEO.test(nom);
}

/** Le type sous lequel servir le fichier d'un bloc. */
export function typeFichierBloc(nom: string): string {
  if (nom.endsWith(".webp")) return "image/webp";
  if (nom.endsWith(".webm")) return "video/webm";
  if (nom.endsWith(".mov")) return "video/quicktime";
  return "video/mp4";
}

/**
 * Un lien posé dans un texte : une adresse web, un courriel, un téléphone,
 * ou un chemin de la plateforme. `null` pour tout le reste — `javascript:`
 * en tête.
 */
export function lienSur(saisie: string): string | null {
  const lien = saisie.trim();
  if (!lien || lien.length > 500 || /[\s<>"]/.test(lien)) return null;
  if (lien.startsWith("/")) return lien.startsWith("//") ? null : lien;
  if (/^(mailto:|tel:)[^\s]+$/i.test(lien)) return lien;
  // « cancham.mg/adhesion » : on complète, comme le ferait le navigateur.
  const complet = /^[a-z][a-z0-9+.-]*:/i.test(lien) ? lien : `https://${lien}`;
  try {
    const url = new URL(complet);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * La vidéo qu'un lien désigne, et l'adresse où elle se lit dans un cadre.
 *
 * Seuls YouTube, Vimeo et Google Drive : ce sont les hébergeurs que la
 * politique de sécurité de la plateforme autorise à s'afficher dans ses
 * pages. `null` pour tout autre lien.
 *
 * Une vidéo de Google Drive ne se lit que si son fichier est partagé à
 * « Tous les utilisateurs disposant du lien » : sinon, c'est la demande
 * d'accès de Google qui s'affiche à la place.
 */
export function lienVideo(saisie: string): {
  plateforme: "youtube" | "vimeo" | "drive";
  integration: string;
} | null {
  let url: URL;
  try {
    const lien = saisie.trim();
    url = new URL(/^https?:\/\//i.test(lien) ? lien : `https://${lien}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const hote = url.hostname.toLowerCase().replace(/^(www|m)\./, "");
  const morceaux = url.pathname.split("/").filter(Boolean);

  if (hote === "youtu.be" || /^youtube(-nocookie)?\.com$/.test(hote)) {
    const id =
      hote === "youtu.be"
        ? morceaux[0]
        : morceaux[0] === "watch"
          ? url.searchParams.get("v")
          : ["embed", "shorts", "live", "v"].includes(morceaux[0] ?? "")
            ? morceaux[1]
            : null;
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    return {
      plateforme: "youtube",
      integration: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
    };
  }

  if (hote === "vimeo.com" || hote === "player.vimeo.com") {
    // vimeo.com/123, vimeo.com/123/cle (vidéo non répertoriée),
    // vimeo.com/channels/x/123, player.vimeo.com/video/123.
    const i = morceaux.findIndex((m) => /^\d{6,12}$/.test(m));
    if (i < 0) return null;
    const cle = url.searchParams.get("h") ?? morceaux[i + 1] ?? "";
    return {
      plateforme: "vimeo",
      integration: `https://player.vimeo.com/video/${morceaux[i]}${
        /^[0-9a-f]{6,20}$/i.test(cle) ? `?h=${cle}` : ""
      }`,
    };
  }

  if (hote === "drive.google.com" || hote === "docs.google.com") {
    // drive.google.com/file/d/ID/view, …/file/u/1/d/ID/preview,
    // drive.google.com/open?id=ID, drive.google.com/uc?id=ID. Un dossier
    // (`/drive/folders/…`) n'est pas une vidéo.
    const d = morceaux.indexOf("d");
    const id =
      morceaux[0] === "file" && d > 0
        ? morceaux[d + 1]
        : morceaux[0] === "open" || morceaux[0] === "uc"
          ? url.searchParams.get("id")
          : null;
    if (!id || !/^[A-Za-z0-9_-]{15,100}$/.test(id)) return null;
    // La clé que Google ajoute aux liens des fichiers anciens.
    const cle = url.searchParams.get("resourcekey") ?? "";
    return {
      plateforme: "drive",
      integration: `https://drive.google.com/file/d/${id}/preview${
        /^[A-Za-z0-9_-]{1,60}$/.test(cle) ? `?resourcekey=${cle}` : ""
      }`,
    };
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Lecture d'une saisie                                                       */
/* -------------------------------------------------------------------------- */

const objet = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;

/** Un texte sans caractère de contrôle, hormis le retour à la ligne. */
const propre = (t: string) =>
  t.replace(/[\u0000-\u0009\u000b-\u001f\u007f\u2028\u2029]/g, "");

const alignementDe = (v: unknown): Alignement | undefined =>
  v === "centre" || v === "droite" ? v : undefined;

/** Une couleur en `#rrggbb`, et rien d'autre : elle finit dans un style. */
function couleurDe(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const couleur = v.toLowerCase();
  return COULEUR.test(couleur) ? couleur : undefined;
}

const memesMarques = (a: Passage, b: Passage) =>
  a.g === b.g &&
  a.i === b.i &&
  a.s === b.s &&
  a.lien === b.lien &&
  a.couleur === b.couleur &&
  a.taille === b.taille;

function lirePassages(
  valeur: unknown,
  budget: { reste: number },
): Passage[] | null {
  if (!Array.isArray(valeur)) return null;
  const passages: Passage[] = [];
  for (const brut of valeur) {
    const p = objet(brut);
    if (!p || typeof p.t !== "string") return null;
    const t = propre(p.t).slice(0, Math.max(0, budget.reste));
    budget.reste -= t.length;
    if (!t) continue;

    const passage: Passage = { t };
    if (p.g === true) passage.g = true;
    if (p.i === true) passage.i = true;
    if (p.s === true) passage.s = true;
    if (typeof p.lien === "string") {
      const lien = lienSur(p.lien);
      if (lien) passage.lien = lien;
    }
    const couleur = couleurDe(p.couleur);
    if (couleur) passage.couleur = couleur;
    if (
      p.taille === "petit" ||
      p.taille === "grand" ||
      p.taille === "tres-grand"
    ) {
      passage.taille = p.taille;
    }

    // Deux passages voisins de même mise en forme n'en font qu'un.
    const dernier = passages[passages.length - 1];
    if (dernier && memesMarques(dernier, passage)) dernier.t += t;
    else passages.push(passage);
  }
  return passages;
}

const aDuTexte = (passages: Passage[]) => passages.some((p) => p.t.trim());

function lireLignes(valeur: unknown): Ligne[] | null {
  if (!Array.isArray(valeur)) return null;
  const budget = { reste: PLAFOND_TEXTE };
  const lignes: Ligne[] = [];
  for (const brut of valeur) {
    const l = objet(brut);
    if (!l) return null;
    if (l.genre === "p") {
      const passages = lirePassages(l.passages, budget);
      if (!passages) return null;
      const alignement = alignementDe(l.alignement);
      lignes.push({
        genre: "p",
        passages,
        ...(alignement ? { alignement } : {}),
      });
    } else if (l.genre === "ul" || l.genre === "ol") {
      if (!Array.isArray(l.items)) return null;
      const items: Passage[][] = [];
      for (const item of l.items) {
        const passages = lirePassages(item, budget);
        if (!passages) return null;
        if (aDuTexte(passages)) items.push(passages);
      }
      if (items.length) lignes.push({ genre: l.genre, items });
    } else {
      return null;
    }
  }
  // Les paragraphes vides n'ont de sens qu'entre deux lignes écrites.
  const vide = (l: Ligne) => l.genre === "p" && !aDuTexte(l.passages);
  while (lignes.length && vide(lignes[0])) lignes.shift();
  while (lignes.length && vide(lignes[lignes.length - 1])) lignes.pop();
  return lignes;
}

export type Lecture =
  { blocs: Bloc[]; erreur?: undefined } | { erreur: string };

/**
 * Lit les blocs reçus d'un formulaire — ou relus de la base — et n'en garde
 * que ce qui est permis.
 *
 * Un bloc laissé vide dans l'éditeur ne s'enregistre pas ; un bloc mal formé
 * refuse la page entière, pour qu'on ne perde pas un contenu sans le savoir.
 * Le fichier d'une photo ou d'une vidéo est soit un nom que la plateforme a
 * donné, soit le jeton d'un envoi : à l'appelant de vérifier qu'il existe.
 */
export function lireBlocs(valeur: unknown): Lecture {
  const illisible = { erreur: "Le contenu de la page est illisible." };
  if (!Array.isArray(valeur)) return illisible;
  if (valeur.length > PLAFOND_BLOCS) {
    return { erreur: `Une page compte ${PLAFOND_BLOCS} blocs au plus.` };
  }

  const blocs: Bloc[] = [];
  for (const brut of valeur) {
    const b = objet(brut);
    if (!b) return illisible;

    if (b.type === "titre") {
      if (typeof b.texte !== "string") return illisible;
      const texte = propre(b.texte).replace(/\s+/g, " ").trim().slice(0, 200);
      if (!texte) continue;
      const alignement = alignementDe(b.alignement);
      const couleur = couleurDe(b.couleur);
      blocs.push({
        type: "titre",
        texte,
        niveau: b.niveau === 3 ? 3 : 2,
        ...(alignement ? { alignement } : {}),
        ...(couleur ? { couleur } : {}),
      });
    } else if (b.type === "texte") {
      const lignes = lireLignes(b.lignes);
      if (!lignes) return illisible;
      if (lignes.length) blocs.push({ type: "texte", lignes });
    } else if (b.type === "photo") {
      if (b.fichier === undefined || b.fichier === "") continue;
      if (typeof b.fichier !== "string") return illisible;
      if (!NOM_PHOTO.test(b.fichier) && !JETON.test(b.fichier)) {
        return illisible;
      }
      const legende =
        typeof b.legende === "string"
          ? propre(b.legende).replace(/\s+/g, " ").trim().slice(0, 300)
          : "";
      blocs.push({
        type: "photo",
        fichier: b.fichier,
        ...(legende ? { legende } : {}),
      });
    } else if (b.type === "video") {
      if (b.source === "lien") {
        if (typeof b.url !== "string") return illisible;
        const url = b.url.trim().slice(0, 500);
        if (!url) continue;
        if (!lienVideo(url)) {
          return {
            erreur:
              "Lien de vidéo non reconnu : collez l’adresse d’une vidéo YouTube, Vimeo ou Google Drive.",
          };
        }
        blocs.push({ type: "video", source: "lien", url });
      } else if (b.source === "fichier") {
        if (b.fichier === undefined || b.fichier === "") continue;
        if (typeof b.fichier !== "string") return illisible;
        if (!NOM_VIDEO.test(b.fichier) && !JETON.test(b.fichier)) {
          return illisible;
        }
        blocs.push({ type: "video", source: "fichier", fichier: b.fichier });
      } else {
        return illisible;
      }
    } else {
      return illisible;
    }
  }
  return { blocs };
}

/** Les blocs relus de la base. Une page abîmée se lit comme une page vide. */
export function blocsEnregistres(contenu: unknown): Bloc[] {
  const lecture = lireBlocs(contenu);
  return lecture.erreur === undefined ? lecture.blocs : [];
}

/** Les fichiers que des blocs emploient. */
export function fichiersDesBlocs(blocs: Bloc[]): string[] {
  return blocs.flatMap((b) =>
    b.type === "photo" || (b.type === "video" && b.source === "fichier")
      ? [b.fichier]
      : [],
  );
}

/**
 * Ce qu'une page contient, en quelques mots, pour l'étiquette de sa carte :
 * « 3 min de lecture · 1 vidéo ».
 */
export function etiquettePage(blocs: Bloc[]): string {
  let mots = 0;
  let photos = 0;
  let videos = 0;
  const compter = (t: string) => t.split(/\s+/).filter(Boolean).length;
  for (const b of blocs) {
    if (b.type === "titre") mots += compter(b.texte);
    else if (b.type === "photo") photos++;
    else if (b.type === "video") videos++;
    else {
      for (const l of b.lignes) {
        const passages = l.genre === "p" ? l.passages : l.items.flat();
        for (const p of passages) mots += compter(p.t);
      }
    }
  }
  const parties: string[] = [];
  if (mots >= 40) {
    parties.push(`${Math.max(1, Math.round(mots / 200))} min de lecture`);
  }
  if (videos) parties.push(`${videos} vidéo${videos > 1 ? "s" : ""}`);
  if (photos && parties.length < 2) {
    parties.push(`${photos} photo${photos > 1 ? "s" : ""}`);
  }
  return parties.join(" · ") || "Page";
}
