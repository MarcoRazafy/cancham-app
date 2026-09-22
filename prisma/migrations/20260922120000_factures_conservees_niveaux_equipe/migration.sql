-- CreateEnum
CREATE TYPE "NiveauEquipe" AS ENUM ('administrateur', 'manager');

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_memberId_fkey";

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "destinataire" JSONB,
ADD COLUMN     "destinataireNom" TEXT,
ALTER COLUMN "memberId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "niveauEquipe" "NiveauEquipe";

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Les administrateurs d'avant gardent le contrôle total : seuls les comptes
-- ouverts désormais peuvent être managers.
UPDATE "users" SET "niveauEquipe" = 'administrateur' WHERE "role" = 'admin';
