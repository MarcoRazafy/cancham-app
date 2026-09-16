-- CreateEnum
CREATE TYPE "Formule" AS ENUM ('madagascar_consultant', 'madagascar_entreprise', 'canada_diaspora', 'canada_entreprise', 'sur_mesure');

-- CreateEnum
CREATE TYPE "Devise" AS ENUM ('MGA', 'CAD');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "devise" "Devise" NOT NULL DEFAULT 'MGA';

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "formule" "Formule" NOT NULL DEFAULT 'madagascar_entreprise';

