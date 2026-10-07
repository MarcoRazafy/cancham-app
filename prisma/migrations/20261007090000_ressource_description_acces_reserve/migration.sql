-- Une ressource peut porter une description, et n'être ouverte qu'aux
-- entreprises que l'équipe a choisies : les autres membres ne la voient pas.

-- AlterTable
ALTER TABLE "resources" ADD COLUMN "description" TEXT,
ADD COLUMN "restreinte" BOOLEAN NOT NULL DEFAULT false;
