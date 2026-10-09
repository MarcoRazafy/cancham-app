export const ETAPES_ACCUEIL = [
  { cle: "vous", court: "Vous" },
  { cle: "entreprise", court: "Entreprise" },
  { cle: "formule", court: "Adhésion" },
  { cle: "activite", court: "Activité" },
  { cle: "visuels", court: "Visuels" },
  { cle: "produits", court: "Produits" },
] as const;

export type EtapeAccueil = (typeof ETAPES_ACCUEIL)[number]["cle"];

export const NOMBRE_ETAPES = ETAPES_ACCUEIL.length;

export const PAYS = ["Madagascar", "Canada", "France", "Autre"] as const;

export const INDICATIFS = [
  { code: "+261", pays: "Madagascar", drapeau: "🇲🇬" },
  { code: "+1", pays: "Canada", drapeau: "🇨🇦" },
  { code: "+33", pays: "France", drapeau: "🇫🇷" },
] as const;

export function numeroComplet(indicatif: string, numero: string): string {
  const n = numero.trim().replace(/\s+/g, " ");
  if (!n) return "";
  if (n.startsWith("+") || !indicatif) return n;
  return `${indicatif} ${n.replace(/^0\s*/, "")}`;
}

export const PROVISOIRE = {
  entreprise: "Entreprise à préciser",
  secteur: "Secteur à préciser",
  ville: "Antananarivo",
  activite: "Activité à préciser.",
  desc: "Description à compléter.",
  fonction: "Représentant(e)",
} as const;

export function saisi(
  valeur: string | null | undefined,
  provisoire: string,
): string {
  return valeur && valeur !== provisoire ? valeur : "";
}

export function nomDepuisCourriel(email: string): string {
  const local = email.split("@")[0] ?? "";
  const mots = local
    .split(/[._\-+0-9]+/)
    .filter(Boolean)
    .map((m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
  return mots.join(" ") || "Nouveau membre";
}

export function numeroEtape(brut: string | undefined): number {
  const n = Number(brut);
  return Number.isInteger(n) && n >= 1 && n <= NOMBRE_ETAPES ? n : 1;
}

export function telephoneValide(saisie: string): boolean {
  return (
    /^[+\d\s().-]{6,30}$/.test(saisie) &&
    (saisie.match(/\d/g) ?? []).length >= 6
  );
}
