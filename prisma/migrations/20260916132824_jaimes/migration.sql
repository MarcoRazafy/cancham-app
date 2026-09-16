-- CreateTable
CREATE TABLE "news_likes" (
    "id" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "news_likes_newsId_idx" ON "news_likes"("newsId");

-- CreateIndex
CREATE UNIQUE INDEX "news_likes_newsId_userId_key" ON "news_likes"("newsId", "userId");

-- AddForeignKey
ALTER TABLE "news_likes" ADD CONSTRAINT "news_likes_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_likes" ADD CONSTRAINT "news_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

