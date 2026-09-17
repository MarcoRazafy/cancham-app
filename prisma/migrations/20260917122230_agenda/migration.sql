-- Heures structurées : la vue Semaine de l'agenda place un événement sur une
-- grille horaire, ce qu'un texte libre (« 17 h 30 – 20 h 00 ») ne permet pas.
ALTER TABLE "events" ADD COLUMN "debut" TEXT,
ADD COLUMN "fin" TEXT;

-- Reprise des plages existantes, écrites « HH h MM – HH h MM ». Une plage qui
-- ne suit pas ce format reste sans heure plutôt que d'en recevoir une fausse.
UPDATE "events" SET
  "debut" = CASE WHEN substring("heure" from '^\s*(\d{1,2})\s*h') IS NOT NULL
    THEN lpad(substring("heure" from '^\s*(\d{1,2})\s*h'), 2, '0') || ':' ||
         coalesce(substring("heure" from '^\s*\d{1,2}\s*h\s*(\d{2})'), '00')
  END,
  "fin" = CASE WHEN substring("heure" from '[–-]\s*(\d{1,2})\s*h') IS NOT NULL
    THEN lpad(substring("heure" from '[–-]\s*(\d{1,2})\s*h'), 2, '0') || ':' ||
         coalesce(substring("heure" from '[–-]\s*\d{1,2}\s*h\s*(\d{2})'), '00')
  END
WHERE "heure" IS NOT NULL;

ALTER TABLE "events" DROP COLUMN "heure";

-- CreateTable
CREATE TABLE "rappels" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "note" TEXT,
    "jour" DATE NOT NULL,
    "heure" TEXT,
    "fait" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rappels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rappels_userId_jour_idx" ON "rappels"("userId", "jour");

-- AddForeignKey
ALTER TABLE "rappels" ADD CONSTRAINT "rappels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
