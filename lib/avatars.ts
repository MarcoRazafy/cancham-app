/**
 * Pastilles d'initiales de l'annuaire.
 *
 * La teinte est tirée de l'identifiant : une même entreprise garde toujours la
 * même couleur, d'un écran à l'autre et d'un rendu à l'autre.
 */
const TEINTES = [
  { background: "#1e3a5f", color: "#93c5fd" },
  { background: "#3b1f2b", color: "#f0a6b4" },
  { background: "#14352a", color: "#6ee7b7" },
  { background: "#3a2a12", color: "#fcd34d" },
  { background: "#2a1f3d", color: "#c4b5fd" },
  { background: "#1f3436", color: "#7dd3d8" },
];

export function teinteDe(id: string): { background: string; color: string } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TEINTES[h % TEINTES.length];
}

export function initialesDe(nom: string): string {
  return nom
    .split(/\s+/)
    .map((mot) => mot[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
