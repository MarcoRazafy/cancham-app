/**
 * La vidéo de présentation d'une fiche membre : ce que le navigateur et le
 * serveur doivent savoir tous les deux.
 *
 * Une vidéo pèse des centaines de mégaoctets, et les connexions d'ici sont
 * lentes : elle ne part pas d'un bloc, mais par morceaux. Un morceau perdu se
 * renvoie seul, l'envoi reprend où il s'est arrêté, et aucune requête ne
 * dure assez pour qu'un intermédiaire la coupe.
 *
 * Sans `server-only` : la fenêtre d'envoi vérifie le fichier avec les mêmes
 * règles que le serveur, avant d'en envoyer le premier octet.
 */

/** Le poids maximal d'une vidéo : 1 Go. */
export const PLAFOND_VIDEO = 1024 * 1024 * 1024;

/** La taille d'un morceau. Le dernier est plus court. */
export const MORCEAU_VIDEO = 8 * 1024 * 1024;

/** Les formats acceptés, et le type sous lequel on les sert. */
export const FORMATS_VIDEO = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
} as const;

export type FormatVideo = keyof typeof FORMATS_VIDEO;

/** Ce que le sélecteur de fichiers propose. */
export const ACCEPT_VIDEO =
  "video/mp4,video/webm,video/quicktime,.mp4,.m4v,.webm,.mov";

/** Le format d'une vidéo, d'après le nom de son fichier. `null` : refusé. */
export function formatVideo(nom: string): FormatVideo | null {
  const extension = /\.([a-z0-9]+)$/i.exec(nom.trim())?.[1]?.toLowerCase();
  if (extension === "mp4" || extension === "m4v") return "mp4";
  if (extension === "webm") return "webm";
  if (extension === "mov") return "mov";
  return null;
}

/**
 * Les premiers octets sont-ils ceux d'une vidéo de ce format ?
 *
 * Le nom d'un fichier ne prouve rien : c'est son début qui dit ce qu'il est.
 * Un WebM s'ouvre sur l'en-tête EBML. Un MP4 ou un QuickTime est une suite
 * de boîtes, dont la première porte son nom du cinquième au huitième octet.
 */
export function signatureVideo(
  debut: Uint8Array,
  format: FormatVideo,
): boolean {
  if (debut.length < 8) return false;
  if (format === "webm") {
    return (
      debut[0] === 0x1a &&
      debut[1] === 0x45 &&
      debut[2] === 0xdf &&
      debut[3] === 0xa3
    );
  }
  const boite = String.fromCharCode(...debut.subarray(4, 8));
  // Un QuickTime ancien commence parfois par ses données, sans `ftyp`.
  return format === "mp4"
    ? boite === "ftyp"
    : ["ftyp", "moov", "mdat", "wide", "free", "skip"].includes(boite);
}

const NOM_VIDEO = /^video-[A-Za-z0-9]+-[0-9a-f]{16}\.(mp4|webm|mov)$/;

/**
 * Vrai pour un nom de fichier que la plateforme a elle-même fabriqué. Tout
 * ce qui vient d'une adresse passe par ici avant de toucher au disque : ni
 * barre oblique, ni « .. », ni rien d'autre que ce motif.
 */
export function estNomVideo(nom: string): boolean {
  return NOM_VIDEO.test(nom);
}

/** Le nom du fichier d'une nouvelle vidéo. */
export function nomVideo(
  memberId: string,
  alea: string,
  format: FormatVideo,
): string {
  return `video-${memberId.replace(/[^A-Za-z0-9]/g, "")}-${alea}.${format}`;
}

/** Le type sous lequel servir un fichier vidéo, d'après son nom. */
export function typeVideo(fichier: string): string {
  return FORMATS_VIDEO[formatVideo(fichier) ?? "mp4"];
}

/** L'adresse où se lit une vidéo. Réservée aux personnes connectées. */
export function urlVideo(fichier: string): string {
  return `/api/videos/${fichier}`;
}

/** Un poids lisible : « 742 Mo », « 1,2 Go ». */
export function poidsLisible(octets: number): string {
  const mo = octets / (1024 * 1024);
  if (mo < 1) return "moins de 1 Mo";
  if (mo < 1000) return `${Math.round(mo)} Mo`;
  return `${(mo / 1024).toFixed(1).replace(".", ",")} Go`;
}
