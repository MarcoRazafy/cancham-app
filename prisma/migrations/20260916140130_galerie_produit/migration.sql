-- Une photo par produit devient une galerie.
--
-- Écrite à la main : la migration générée ajoutait `photos` puis supprimait
-- `photo`, et chaque image déjà posée par un membre était perdue au passage.
-- La photo existante devient la première de la galerie.

ALTER TABLE "produits" ADD COLUMN "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "produits" SET "photos" = ARRAY["photo"] WHERE "photo" IS NOT NULL;

ALTER TABLE "produits" DROP COLUMN "photo";
