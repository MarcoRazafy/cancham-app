-- Un membre peut publier une actualité au nom de son entreprise : on garde
-- qui l'a publiée. Sans entreprise, c'est une actualité de la chambre.

-- AlterTable
ALTER TABLE "news" ADD COLUMN "memberId" TEXT,
ADD COLUMN "auteurNom" TEXT;

-- CreateIndex
CREATE INDEX "news_memberId_idx" ON "news"("memberId");

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
