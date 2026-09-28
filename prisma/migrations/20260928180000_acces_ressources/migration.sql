-- Accès d'une entreprise membre à une ressource payante.
--
-- Une ressource incluse dans l'adhésion n'a pas de liste : tout membre à jour
-- la lit. Une ressource facturée ne s'ouvre qu'à celles qui l'ont acquise.

CREATE TABLE "acces_ressources" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "ouvertPar" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acces_ressources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "acces_ressources_resourceId_memberId_key" ON "acces_ressources"("resourceId", "memberId");
CREATE INDEX "acces_ressources_memberId_idx" ON "acces_ressources"("memberId");

ALTER TABLE "acces_ressources" ADD CONSTRAINT "acces_ressources_resourceId_fkey"
  FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "acces_ressources" ADD CONSTRAINT "acces_ressources_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
