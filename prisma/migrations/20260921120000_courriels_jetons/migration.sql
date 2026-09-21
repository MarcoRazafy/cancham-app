-- AlterTable
ALTER TABLE "users" ADD COLUMN     "motDePasseModifieLe" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "jetons_compte" (
    "id" TEXT NOT NULL,
    "empreinte" TEXT NOT NULL,
    "usage" TEXT NOT NULL,
    "expire" TIMESTAMP(3) NOT NULL,
    "utiliseLe" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jetons_compte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jetons_compte_empreinte_key" ON "jetons_compte"("empreinte");

-- CreateIndex
CREATE INDEX "jetons_compte_userId_idx" ON "jetons_compte"("userId");

-- AddForeignKey
ALTER TABLE "jetons_compte" ADD CONSTRAINT "jetons_compte_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
