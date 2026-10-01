-- Un service peut mener quelque part : la prise d'un rendez-vous, une page,
-- un site. Sans lien, son bouton écrit à l'équipe, comme avant.

-- AlterTable
ALTER TABLE "cancham_services" ADD COLUMN "lien" TEXT;
