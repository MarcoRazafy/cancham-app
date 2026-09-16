-- AlterTable
ALTER TABLE "message_threads" ADD COLUMN     "memberId" TEXT;

-- CreateIndex
CREATE INDEX "message_threads_memberId_idx" ON "message_threads"("memberId");

