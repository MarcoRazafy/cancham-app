/** Minuscules sans accents : « Événement » et « evenement » se valent. */
export function plat(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Mots lus par minute : la moyenne admise pour une lecture d'écran en français. */
const MOTS_PAR_MINUTE = 200;

/**
 * Durée de lecture d'un texte, en minutes, arrondie au-dessus.
 *
 * Une minute au moins : « 0 min de lecture » ne veut rien dire, et un article
 * de trois lignes se lit quand même.
 */
export function dureeLecture(texte: string): number {
  const mots = texte.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(mots / MOTS_PAR_MINUTE));
}
