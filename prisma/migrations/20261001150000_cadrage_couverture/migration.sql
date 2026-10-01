-- La couverture d'une fiche se repositionne : on garde le point de la photo
-- qui reste visible quand le cadre la rogne, en pourcentages. Centrée par
-- défaut, comme elle l'était jusqu'ici.

-- AlterTable
ALTER TABLE "members" ADD COLUMN "coverX" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "coverY" INTEGER NOT NULL DEFAULT 50;
