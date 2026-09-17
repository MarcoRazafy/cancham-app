/** Minuscules sans accents : « Événement » et « evenement » se valent. */
export function plat(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
