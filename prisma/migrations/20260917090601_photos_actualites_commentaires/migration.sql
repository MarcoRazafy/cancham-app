-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "modifieLe" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT;

-- Les commentaires existants retrouvent leur auteur par son nom, quand un
-- seul compte le porte : un homonyme ne doit pas hériter du droit de modifier.
UPDATE "comments" c
SET "userId" = u."id"
FROM "users" u
WHERE u."nom" = c."auteur"
  AND (SELECT count(*) FROM "users" u2 WHERE u2."nom" = c."auteur") = 1;

-- AlterTable : la photo unique devient la première d'une liste, sans perte.
ALTER TABLE "news" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
UPDATE "news" SET "images" = ARRAY["image"] WHERE "image" IS NOT NULL;
ALTER TABLE "news" DROP COLUMN "image";

-- CreateTable
CREATE TABLE "comment_likes" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comment_likes_commentId_idx" ON "comment_likes"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "comment_likes_commentId_userId_key" ON "comment_likes"("commentId", "userId");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

