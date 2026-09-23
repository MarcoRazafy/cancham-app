-- CreateTable
CREATE TABLE "types_rendezvous" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "detail" TEXT,
    "duree" INTEGER NOT NULL DEFAULT 30,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "types_rendezvous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilites" (
    "id" TEXT NOT NULL,
    "jour" INTEGER NOT NULL,
    "debut" TEXT NOT NULL,
    "fin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disponibilites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rendezvous" (
    "id" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memberId" TEXT,
    "jour" DATE NOT NULL,
    "debut" TEXT NOT NULL,
    "fin" TEXT NOT NULL,
    "motif" TEXT,
    "annuleLe" TIMESTAMP(3),
    "annulePar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rendezvous_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "disponibilites_jour_idx" ON "disponibilites"("jour");

-- CreateIndex
CREATE INDEX "rendezvous_jour_idx" ON "rendezvous"("jour");

-- CreateIndex
CREATE INDEX "rendezvous_userId_idx" ON "rendezvous"("userId");

-- AddForeignKey
ALTER TABLE "rendezvous" ADD CONSTRAINT "rendezvous_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "types_rendezvous"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendezvous" ADD CONSTRAINT "rendezvous_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendezvous" ADD CONSTRAINT "rendezvous_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Un créneau ne se réserve qu'une fois — tant que le rendez-vous tient.
-- Index partiel : une annulation libère l'heure, et c'est la base qui
-- arbitre entre deux clics simultanés.
CREATE UNIQUE INDEX "rendezvous_creneau_unique"
  ON "rendezvous" ("jour", "debut")
  WHERE "annuleLe" IS NULL;
