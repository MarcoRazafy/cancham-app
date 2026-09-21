/**
 * Accueil d'un nouvel inscrit.
 *
 * L'inscription ne demande que l'essentiel : courriel, fonction, téléphone
 * (facultatif) et mot de passe. On se connecte ensuite, et le reste — qui
 * l'on est, l'entreprise, la formule et la motivation, l'activité — se
 * complète à la première
 * connexion, une étape à la fois, chacune pouvant être passée. On s'inscrit
 * en une minute ; la fiche se remplit à son rythme.
 *
 * Tant qu'une information n'est pas donnée, la fiche porte une valeur
 * provisoire : le schéma exige un nom d'entreprise, un secteur, une
 * description. Ces valeurs sont connues ici pour que les formulaires les
 * présentent comme des champs vides, pas comme des réponses.
 */

export const ETAPES_ACCUEIL = [
  { cle: "vous", court: "Vous" },
  { cle: "entreprise", court: "Entreprise" },
  { cle: "formule", court: "Adhésion" },
  { cle: "activite", court: "Activité" },
] as const;

export type EtapeAccueil = (typeof ETAPES_ACCUEIL)[number]["cle"];

export const NOMBRE_ETAPES = ETAPES_ACCUEIL.length;

/** Valeurs de la fiche tant que le membre ne les a pas données. */
export const PROVISOIRE = {
  entreprise: "Entreprise à préciser",
  secteur: "Secteur à préciser",
  ville: "Antananarivo",
  activite: "Activité à préciser.",
  desc: "Description à compléter.",
  fonction: "Représentant(e)",
} as const;

/** La valeur saisie, ou rien si c'est encore la valeur provisoire. */
export function saisi(
  valeur: string | null | undefined,
  provisoire: string,
): string {
  return valeur && valeur !== provisoire ? valeur : "";
}

/**
 * Nom provisoire tiré de l'adresse : « voninkazo.a@… » donne
 * « Voninkazo A ». Il ne sert qu'à saluer la personne en attendant qu'elle
 * donne son vrai nom, à la première étape.
 */
export function nomDepuisCourriel(email: string): string {
  const local = email.split("@")[0] ?? "";
  const mots = local
    .split(/[._\-+0-9]+/)
    .filter(Boolean)
    .map((m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
  return mots.join(" ") || "Nouveau membre";
}

/** Numéro d'étape lu dans l'adresse, borné aux étapes existantes. */
export function numeroEtape(brut: string | undefined): number {
  const n = Number(brut);
  return Number.isInteger(n) && n >= 1 && n <= NOMBRE_ETAPES ? n : 1;
}

/**
 * Un numéro de téléphone plausible : chiffres, espaces, « + », points,
 * tirets et parenthèses, avec au moins six chiffres. On ne vérifie pas le
 * format d'un pays : les membres appellent de Madagascar comme du Canada.
 */
export function telephoneValide(saisie: string): boolean {
  return (
    /^[+\d\s().-]{6,30}$/.test(saisie) &&
    (saisie.match(/\d/g) ?? []).length >= 6
  );
}
