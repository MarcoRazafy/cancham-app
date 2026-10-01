/**
 * Où une offre de membre s'affiche.
 *
 * L'équipe le choisit en publiant l'offre : dans le rail des Actualités, sur
 * le tableau de bord des membres, ou aux deux endroits. Sans `server-only` :
 * le formulaire, côté navigateur, a besoin des libellés.
 */
export type EmplacementOffre = "partout" | "actualites" | "tableau_de_bord";

/** Dans l'ordre où le formulaire les propose. */
export const EMPLACEMENTS_OFFRE: Record<EmplacementOffre, string> = {
  actualites: "Actualités",
  tableau_de_bord: "Tableau de bord",
  partout: "Les deux",
};

export function estEmplacementOffre(v: string): v is EmplacementOffre {
  return v in EMPLACEMENTS_OFFRE;
}

/** Ce que le rail des Actualités montre, au plus : deux colonnes, deux lignes. */
export const OFFRES_DU_RAIL = 4;
