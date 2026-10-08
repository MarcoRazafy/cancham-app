-- Ce qu'un membre a déjà ouvert dans la bibliothèque : la vue d'un dossier
-- lui montre où il en est, ressource par ressource.

-- CreateTable
CREATE TABLE "lectures_ressources" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lectures_ressources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lectures_ressources_resourceId_idx" ON "lectures_ressources"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "lectures_ressources_userId_resourceId_key" ON "lectures_ressources"("userId", "resourceId");

-- AddForeignKey
ALTER TABLE "lectures_ressources" ADD CONSTRAINT "lectures_ressources_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lectures_ressources" ADD CONSTRAINT "lectures_ressources_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

