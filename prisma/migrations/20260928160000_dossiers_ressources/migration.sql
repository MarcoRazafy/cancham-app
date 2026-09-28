-- Dossiers de la bibliothèque : un classeur, et des classeurs dedans.
--
-- Une ressource qui perd son dossier retombe à la racine (`SET NULL`) :
-- supprimer un classeur ne doit jamais emporter les documents qu'il rangeait.

CREATE TABLE "dossiers_ressources" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dossiers_ressources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "dossiers_ressources_parentId_idx" ON "dossiers_ressources"("parentId");

ALTER TABLE "dossiers_ressources" ADD CONSTRAINT "dossiers_ressources_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "dossiers_ressources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resources" ADD COLUMN "dossierId" TEXT;

CREATE INDEX "resources_dossierId_idx" ON "resources"("dossierId");

ALTER TABLE "resources" ADD CONSTRAINT "resources_dossierId_fkey"
  FOREIGN KEY ("dossierId") REFERENCES "dossiers_ressources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
