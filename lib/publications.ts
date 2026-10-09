export const LONGUEUR_PUBLICATION = 5000;
export const PHOTOS_PAR_PUBLICATION = 10;

const LONGUEUR_TITRE = 90;
const LONGUEUR_EXTRAIT = 280;

export type EtatPublication =
  | { etape: "saisie" }
  | {
      etape: "erreur";
      erreur: string;
      photosPerdues: boolean;
    }
  | { etape: "publiee"; id: string };

export const PUBLICATION_VIERGE: EtatPublication = { etape: "saisie" };

export function textePublication(
  saisie: unknown,
  max = LONGUEUR_PUBLICATION,
): string {
  const propre = String(saisie ?? "")
    .slice(0, 4 * max)
    .replace(/\r\n?/g, "\n")
    .replace(/(?<![ \t])[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (propre.length <= max) return propre;
  return Array.from(propre).slice(0, max).join("").trim();
}

function couper(texte: string, max: number): string {
  const lettres = Array.from(texte);
  if (lettres.length <= max) return texte;
  const debut = lettres.slice(0, max).join("");
  const espace = debut.search(/\s\S*$/);
  const garde = espace > max / 2 ? debut.slice(0, espace) : debut;
  return `${garde.replace(/[\s.,;:!?–—-]+$/, "")}…`;
}

export function titreDePublication(texte: string, entreprise: string): string {
  const ligne =
    texte
      .split("\n")
      .map((l) => l.replace(/\s+/g, " ").trim())
      .find(Boolean) ?? "";
  return ligne
    ? couper(ligne, LONGUEUR_TITRE)
    : `Publication de ${entreprise}`.slice(0, 160);
}

export function extraitDePublication(texte: string): string {
  return couper(texte.replace(/\s+/g, " ").trim(), LONGUEUR_EXTRAIT);
}

export function publicationLongue(texte: string): boolean {
  return texte.length > 480 || texte.split("\n").length > 7;
}
