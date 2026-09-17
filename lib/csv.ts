/**
 * Fichiers CSV pour tableur.
 *
 * Réglés pour Excel en français, l'outil de l'équipe : point-virgule comme
 * séparateur (la virgule y est le séparateur décimal), BOM UTF-8 pour que les
 * accents s'affichent, fins de ligne CRLF.
 */

type Cellule = string | number | null | undefined;

/**
 * Une cellule qui commence par `=`, `+`, `-` ou `@` serait exécutée comme une
 * formule à l'ouverture : un nom d'entreprise saisi sur le formulaire public
 * suffirait à piéger le fichier. On la désamorce d'une apostrophe.
 */
function cellule(v: Cellule): string {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function versCsv(entetes: string[], lignes: Cellule[][]): string {
  return (
    "﻿" + [entetes, ...lignes].map((l) => l.map(cellule).join(";")).join("\r\n")
  );
}

/** Réponse de téléchargement, nommée et datée. */
export function reponseCsv(nom: string, contenu: string): Response {
  const date = new Date().toISOString().slice(0, 10);
  return new Response(contenu, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nom}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
