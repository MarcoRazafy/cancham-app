-- CreateEnum
CREATE TYPE "ProduitType" AS ENUM ('produit', 'service');

-- AlterTable
ALTER TABLE "produits" ADD COLUMN     "description" TEXT,
ADD COLUMN     "prix" TEXT,
ADD COLUMN     "type" "ProduitType" NOT NULL DEFAULT 'service';

