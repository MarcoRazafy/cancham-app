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
export const RACINE_STOCKAGE = path.resolve(
  process.env.STOCKAGE_RACINE || path.join(process.cwd(), "stockage"),
);

/** Un sous-dossier du stockage. */
export function dossierStockage(...parties: string[]): string {
  return path.join(RACINE_STOCKAGE, ...parties);
}
