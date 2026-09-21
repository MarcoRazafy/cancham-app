/**
 * Adhésion d'un nouveau membre.
 *
 * L'inscription reprend la fiche de la chambre : nom, prénom, courriel,
 * téléphone, ville, pays, entreprise, secteur (facultatif) et motivation,
 * avec un mot de passe. Elle dépose une candidature : pas de connexion tant
 * que l'équipe ne l'a pas validée.
 *
 * Validée, la candidature ouvre la connexion ; la première mène à la suite
 * de la fiche, une étape à la fois — fonction, détails de l'entreprise,
 * formule, activité, visuels, produits —, chacune pouvant être passée.
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
  { cle: "visuels", court: "Visuels" },
  { cle: "produits", court: "Produits" },
] as const;

export type EtapeAccueil = (typeof ETAPES_ACCUEIL)[number]["cle"];

export const NOMBRE_ETAPES = ETAPES_ACCUEIL.length;

/** Pays d'implantation proposés, dans l'ordre de la fiche : Madagascar d'abord. */
export const PAYS = ["Madagascar", "Canada", "France", "Autre"] as const;

/** Indicatifs téléphoniques proposés à l'inscription, Madagascar d'abord. */
export const INDICATIFS = [
  { code: "+261", pays: "Madagascar", drapeau: "🇲🇬" },
  { code: "+1", pays: "Canada", drapeau: "🇨🇦" },
  { code: "+33", pays: "France", drapeau: "🇫🇷" },
] as const;

/**
 * Numéro complet, indicatif compris : « +261 » et « 034 50 280 53 » donnent
 * « +261 34 50 280 53 » — le 0 initial du numéro national tombe. Un numéro
 * déjà saisi avec son « + » est gardé tel quel.
 */
export function numeroComplet(indicatif: string, numero: string): string {
  const n = numero.trim().replace(/\s+/g, " ");
  if (!n) return "";
  if (n.startsWith("+") || !indicatif) return n;
  return `${indicatif} ${n.replace(/^0\s*/, "")}`;
}

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
