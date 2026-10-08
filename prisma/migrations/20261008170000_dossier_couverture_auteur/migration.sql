-- Un dossier de la bibliothèque porte sa propre couverture, et dit qui l'a
-- conçu : son nom, sa fonction, quelques lignes et son portrait.

-- AlterTable
ALTER TABLE "dossiers_ressources" ADD COLUMN     "auteurBio" TEXT,
ADD COLUMN     "auteurNom" TEXT,
ADD COLUMN     "auteurPhoto" TEXT,
ADD COLUMN     "auteurRole" TEXT,
ADD COLUMN     "cover" TEXT;

