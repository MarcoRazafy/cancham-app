-- Un membre peut joindre une vidéo de présentation à sa fiche : on garde le
-- nom de son fichier. Sans vidéo, la colonne reste vide.

-- AlterTable
ALTER TABLE "members" ADD COLUMN "video" TEXT;
