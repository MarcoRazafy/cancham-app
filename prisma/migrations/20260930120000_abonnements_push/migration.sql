-- Les navigateurs abonnés aux notifications de l'appareil (Web Push) :
-- une ligne par navigateur, rattachée à la personne connectée.

-- CreateTable
CREATE TABLE "abonnements_push" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "appareil" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vuLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonnements_push_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "abonnements_push_endpoint_key" ON "abonnements_push"("endpoint");

-- CreateIndex
CREATE INDEX "abonnements_push_userId_idx" ON "abonnements_push"("userId");

-- AddForeignKey
ALTER TABLE "abonnements_push" ADD CONSTRAINT "abonnements_push_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
