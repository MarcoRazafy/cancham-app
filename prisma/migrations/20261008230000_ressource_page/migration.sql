-- Une ressource peut être une page composée dans la plateforme : des blocs
-- (titre, texte, photo, vidéo) rangés dans `contenu`, sous le format « Page ».
-- Les ressources faites d'un fichier ne changent pas : `contenu` y reste vide.

-- AlterEnum
ALTER TYPE "ResourceFormat" ADD VALUE 'Page';

-- AlterTable
ALTER TABLE "resources" ADD COLUMN     "contenu" JSONB;

