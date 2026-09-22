-- AlterTable
ALTER TABLE "events" ADD COLUMN     "prixPublic" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "public" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "news" ADD COLUMN     "public" BOOLEAN NOT NULL DEFAULT false;


-- Jusqu'ici, tout événement était sur la page publique, au même tarif pour
-- tous : il y reste, et son tarif public reprend celui des membres. Les
-- actualités n'y paraissaient pas : elles restent réservées aux membres.
UPDATE "events" SET "prixPublic" = "prix" WHERE "payant";
