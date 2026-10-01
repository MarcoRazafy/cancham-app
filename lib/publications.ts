/**
 * La publication libre d'un membre : un texte, des photos, rien d'autre.
 *
 * Le membre n'écrit ni titre ni résumé. La ligne en base en garde pourtant
 * un de chaque : les notifications, la recherche, le journal et le
 * back-office désignent une publication par son titre. On les tire donc du
 * texte. Le fil, lui, n'affiche que le texte — le titre ferait doublon.
 *
 * Sans `server-only` : la fenêtre de publication borne la saisie avec les
 * mêmes nombres que le serveur.
 */

/** Longueur d'une publication, en caractères. */
export const LONGUEUR_PUBLICATION = 5000;
/** Photos d'une publication, au plus. */
export const PHOTOS_PAR_PUBLICATION = 10;

const LONGUEUR_TITRE = 90;
const LONGUEUR_EXTRAIT = 280;

/** Ce que la fenêtre de publication sait de sa dernière tentative. */
export type EtatPublication =
  | { etape: "saisie" }
  | {
      etape: "erreur";
      erreur: string;
      /**
       * Les photos envoyées d'avance ont été consommées par la tentative :
       * il faut les choisir à nouveau.
       */
      photosPerdues: boolean;
    }
  | { etape: "publiee"; id: string };

export const PUBLICATION_VIERGE: EtatPublication = { etape: "saisie" };

/**
 * Le texte tel qu'on l'enregistre : fins de ligne unifiées, pas de lignes
 * vides en tête ni en queue, jamais plus de deux retours de suite, et la
 * longueur bornée.
 *
 * `max` ne sert qu'à la modification : un texte déjà enregistré plus long
 * que la limite — écrit avant elle, ou allongé par l'équipe — n'est pas
 * raccourci parce qu'on en change la diffusion.
 */
export function textePublication(
  saisie: unknown,
  max = LONGUEUR_PUBLICATION,
): string {
  const propre = String(saisie ?? "")
    // Bornée avant tout traitement : ce que le navigateur envoie n'a pas de
    // limite, et un texte géant ne doit pas occuper le serveur.
    .slice(0, 4 * max)
    .replace(/\r\n?/g, "\n")
    // Le regard en arrière ne laisse qu'une tentative par suite d'espaces :
    // sans lui, la recherche repartait de chaque espace, et quelques
    // dizaines de milliers d'espaces figeaient le serveur.
    .replace(/(?<![ \t])[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (propre.length <= max) return propre;
  // Par caractères : la borne ne tranche pas un émoji en deux.
  return Array.from(propre).slice(0, max).join("").trim();
}

/**
 * Coupe à `max` caractères sans trancher un mot — ni une adresse, qui
 * deviendrait un lien cassé — ni une paire d'un émoji.
 */
function couper(texte: string, max: number): string {
  // Par caractères et non par unités UTF-16 : un émoji compte pour un.
  const lettres = Array.from(texte);
  if (lettres.length <= max) return texte;
  const debut = lettres.slice(0, max).join("");
  const espace = debut.search(/\s\S*$/);
  // Un mot plus long que la moitié de la coupe : on tranche quand même,
  // plutôt que de ne presque rien garder.
  const garde = espace > max / 2 ? debut.slice(0, espace) : debut;
  return `${garde.replace(/[\s.,;:!?–—-]+$/, "")}…`;
}

/**
 * Le titre d'une publication libre : sa première ligne, raccourcie. Sans
 * texte — des photos seules —, elle porte le nom de qui la publie.
 */
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

/** Le résumé d'une publication libre : le début du texte, sur une ligne. */
export function extraitDePublication(texte: string): string {
  return couper(texte.replace(/\s+/g, " ").trim(), LONGUEUR_EXTRAIT);
}

/**
 * Le fil replie un texte long : au-delà, « Voir plus » mène à la
 * publication entière.
 */
export function publicationLongue(texte: string): boolean {
  return texte.length > 480 || texte.split("\n").length > 7;
}
