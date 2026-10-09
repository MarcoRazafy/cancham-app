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

export function secteurOuProvisoire(
  saisie: string,
  provisoire: string,
): string {
  return estSecteur(saisie) ? saisie : provisoire;
}
