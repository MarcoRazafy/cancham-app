type Cellule = string | number | null | undefined;

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
