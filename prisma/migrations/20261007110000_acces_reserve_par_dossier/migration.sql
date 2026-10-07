-- L'accès personnalisé se règle sur le dossier, pas sur la ressource : un
-- dossier réservé n'existe que pour les entreprises que l'équipe a choisies,
-- avec tout ce qu'il contient. La colonne posée la veille sur les ressources
-- repart ; aucune ressource ne s'en servait.

-- AlterTable
ALTER TABLE "dossiers_ressources" ADD COLUMN     "restreint" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "resources" DROP COLUMN "restreinte";

-- CreateTable
CREATE TABLE "acces_dossiers" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "ouvertPar" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acces_dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "acces_dossiers_memberId_idx" ON "acces_dossiers"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "acces_dossiers_dossierId_memberId_key" ON "acces_dossiers"("dossierId", "memberId");

-- AddForeignKey
ALTER TABLE "acces_dossiers" ADD CONSTRAINT "acces_dossiers_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers_ressources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acces_dossiers" ADD CONSTRAINT "acces_dossiers_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

