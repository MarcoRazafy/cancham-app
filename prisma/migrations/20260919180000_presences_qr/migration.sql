-- AlterTable
ALTER TABLE "attendees" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "attendees_code_key" ON "attendees"("code");

-- Rattrapage : chaque inscription d'un membre donne son code à la ligne de
-- la liste d'accueil créée avec elle — même événement, même entreprise. Si
-- l'entreprise a plusieurs lignes, la plus ancienne le reçoit.
UPDATE "attendees" AS a
SET "code" = x."code"
FROM (
  SELECT DISTINCT ON (r."id") r."code", a2."id" AS "attendeeId"
  FROM "registrations" r
  JOIN "members" m ON m."id" = r."memberId"
  JOIN "attendees" a2 ON a2."eventId" = r."eventId" AND a2."entreprise" = m."nom"
  ORDER BY r."id", a2."createdAt"
) AS x
WHERE a."id" = x."attendeeId";
