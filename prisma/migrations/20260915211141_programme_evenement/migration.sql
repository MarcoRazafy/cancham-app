-- AlterTable
ALTER TABLE "events" ADD COLUMN     "heure" TEXT,
ADD COLUMN     "pourQui" TEXT;

-- CreateTable
CREATE TABLE "event_agenda" (
    "id" TEXT NOT NULL,
    "heure" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "detail" TEXT,
    "ordre" INTEGER NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "event_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_agenda_eventId_ordre_idx" ON "event_agenda"("eventId", "ordre");

-- AddForeignKey
ALTER TABLE "event_agenda" ADD CONSTRAINT "event_agenda_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

