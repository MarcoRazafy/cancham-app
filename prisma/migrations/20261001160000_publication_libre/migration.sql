-- Un membre publie désormais un texte libre, sans titre ni résumé : le
-- titre et le résumé de la ligne sont tirés du texte. On marque ces
-- publications pour n'afficher que le texte. Les actualités existantes
-- restent des articles.

-- AlterTable
ALTER TABLE "news" ADD COLUMN "libre" BOOLEAN NOT NULL DEFAULT false;
