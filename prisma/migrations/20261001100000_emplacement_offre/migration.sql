-- Une offre de membre s'affiche dans le rail des Actualités, sur le tableau
-- de bord des membres, ou aux deux endroits : l'équipe choisit. Les offres
-- déjà publiées restent partout, comme avant.

-- CreateEnum
CREATE TYPE "EmplacementOffre" AS ENUM ('partout', 'actualites', 'tableau_de_bord');

-- AlterTable
ALTER TABLE "offers" ADD COLUMN "emplacement" "EmplacementOffre" NOT NULL DEFAULT 'partout';
