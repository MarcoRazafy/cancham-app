/**
 * Secteurs d'activité de l'annuaire.
 *
 * Une liste fermée plutôt qu'un champ libre : « Agroalimentaire & export »
 * et « agro-alimentaire » ne se retrouvaient pas dans le même filtre. Tous
 * les formulaires proposent ces choix-là, et le filtre de l'annuaire aussi.
 *
 * Changer un libellé ici ne renomme pas les fiches déjà enregistrées : il
 * faut les reprendre en base, par une migration.
 */
export const SECTEURS = [
  "Agribusiness",
  "Artisanat",
  "Digital",
  "Formation & accompagnement",
  "Tourisme",
  "Mines et ressources naturelles",
  "Energie",
  "Mobilité internationale et immigration",
  "Pêche et aquaculture",
  "Textile et habillement",
  "BTP, immobilier et infrastructures",
  "Commerce, import-export et distribution",
  "Transport",
  "Services financiers",
  "Communication, médias et événementiel",
  "Santé",
  "Autres produits",
  "Autres services",
] as const;

export type Secteur = (typeof SECTEURS)[number];

export function estSecteur(valeur: string): valeur is Secteur {
  return (SECTEURS as readonly string[]).includes(valeur);
}

/**
 * Secteur reçu d'un formulaire de création : un secteur de la liste, ou la
 * valeur provisoire quand rien n'est choisi — une valeur fabriquée à la main
 * compte comme rien.
 */
export function secteurOuProvisoire(
  saisie: string,
  provisoire: string,
): string {
  return estSecteur(saisie) ? saisie : provisoire;
}
