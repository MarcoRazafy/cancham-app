-- Les ressources d'un dossier sont des étapes : l'équipe choisit leur ordre.
-- Zéro partout au départ, ce qui garde l'ordre actuel, du plus récent au
-- plus ancien, jusqu'au premier rangement.

-- AlterTable
ALTER TABLE "resources" ADD COLUMN     "ordre" INTEGER NOT NULL DEFAULT 0;

