/**
 * Codes d'accueil des événements : ceux que portent les QR codes.
 *
 * Une inscription a son code (« CC-VOPA-K7Q2PX ») ; ses représentants le
 * reprennent, le premier tel quel, les suivants avec leur rang
 * (« CC-VOPA-K7Q2PX-2 »). Les anciens codes (« CC-E2-4718 ») restent lus.
 */

/** Le code d'un représentant, selon son rang dans l'inscription (0, 1, 2…). */
export function codeRepresentant(code: string, rang: number): string {
  return rang === 0 ? code : `${code}-${rang + 1}`;
}

/** Le code de l'inscription d'où vient celui d'un représentant : sans son rang. */
export function codeInscription(code: string): string {
  return code.replace(/-\d{1,2}$/, "");
}

/**
 * Le code lu par le scanner ou saisi à la main, même au milieu d'un texte
 * plus long, en majuscules. À défaut de motif reconnu, la saisie telle quelle.
 */
export function extraireCode(lu: string): string {
  return (
    /CC-[A-Z0-9]+-[A-Z0-9]{4,8}(?:-\d{1,2})?/i.exec(lu)?.[0].toUpperCase() ??
    lu.trim()
  );
}
