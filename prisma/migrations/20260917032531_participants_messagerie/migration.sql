-- DropForeignKey
ALTER TABLE "message_threads" DROP CONSTRAINT "message_threads_contactId_fkey";

-- DropIndex
DROP INDEX "message_threads_memberId_idx";

-- AlterTable
ALTER TABLE "message_threads" DROP COLUMN "contactId",
DROP COLUMN "init",
DROP COLUMN "memberId",
DROP COLUMN "sousTitre",
DROP COLUMN "unread",
ADD COLUMN     "equipe" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "nom" DROP NOT NULL;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "modifieLe" TIMESTAMP(3),
ADD COLUMN     "supprimeLe" TIMESTAMP(3),
ADD COLUMN     "transfere" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "participants_fils" (
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "luLe" TIMESTAMP(3),
    "ajouteLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participants_fils_pkey" PRIMARY KEY ("threadId","userId")
);

-- CreateIndex
CREATE INDEX "participants_fils_userId_idx" ON "participants_fils"("userId");

-- AddForeignKey
ALTER TABLE "participants_fils" ADD CONSTRAINT "participants_fils_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants_fils" ADD CONSTRAINT "participants_fils_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

