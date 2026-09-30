-- Une facture de participation connaît son événement : réglée, elle
-- confirme l'inscription et fait partir les billets d'elle-même.

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "eventId" TEXT;

-- CreateIndex
CREATE INDEX "invoices_eventId_idx" ON "invoices"("eventId");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
