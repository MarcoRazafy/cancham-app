-- AlterTable
ALTER TABLE "message_threads" ADD COLUMN     "visiteur" JSONB,
ADD COLUMN     "visiteurCle" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "message_threads_visiteurCle_key" ON "message_threads"("visiteurCle");

