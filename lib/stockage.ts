import path from "node:path";

/**
 * Racine de tout ce que la plateforme écrit pendant qu'elle tourne : images
 * envoyées, ressources converties, pièces jointes de la messagerie.
 *
 * En production, c'est le volume persistant de Railway (`STOCKAGE_RACINE`,
 * par exemple `/data`) : le disque du conteneur, lui, est effacé à chaque
 * déploiement et à chaque redémarrage. En local, un dossier `stockage/` à la
 * racine du projet, ignoré par git.
 *
 * Rien n'est écrit dans `public/` : Next ne sert que les fichiers présents
 * dans ce dossier au moment de la compilation, et une image envoyée ensuite
 * n'y serait jamais visible en production.
 */
// `turbopackIgnore` : ces chemins désignent des données écrites pendant
// l'exécution, pas du code. Sans la mention, la compilation croit devoir
// embarquer tout le projet au cas où un fichier y serait lu.
export const RACINE_STOCKAGE = path.resolve(
  /*turbopackIgnore: true*/
  process.env.STOCKAGE_RACINE || path.join(process.cwd(), "stockage"),
);

/** Un sous-dossier du stockage. */
export function dossierStockage(...parties: string[]): string {
  return path.join(/*turbopackIgnore: true*/ RACINE_STOCKAGE, ...parties);
}
