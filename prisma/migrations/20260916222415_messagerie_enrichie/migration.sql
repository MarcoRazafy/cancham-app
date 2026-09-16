-- CreateEnum
CREATE TYPE "TypePieceJointe" AS ENUM ('image', 'video', 'pdf');

-- AlterTable
ALTER TABLE "message_threads" ADD COLUMN     "contactId" TEXT;

-- CreateTable
CREATE TABLE "pieces_jointes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypePieceJointe" NOT NULL,
    "fichier" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pieces_jointes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pieces_jointes_messageId_idx" ON "pieces_jointes"("messageId");

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pieces_jointes" ADD CONSTRAINT "pieces_jointes_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

