-- Les heures d'accueil appartenaient à toute la chambre ; elles appartiennent
-- désormais à un type de rendez-vous : on ne reçoit pas pour un entretien
-- d'une heure aux heures réservées aux points rapides.
--
-- Chaque plage existante est recopiée pour chaque type proposé : le
-- comportement d'avant est reconduit à l'identique, et l'équipe n'a qu'à
-- retirer ce qui ne convient pas.

DROP INDEX "disponibilites_jour_idx";

ALTER TABLE "disponibilites" ADD COLUMN "typeId" TEXT;

INSERT INTO "disponibilites" ("id", "jour", "debut", "fin", "typeId", "createdAt")
SELECT md5(random()::text || clock_timestamp()::text || d."id"),
       d."jour", d."debut", d."fin", t."id", d."createdAt"
  FROM "disponibilites" d
 CROSS JOIN "types_rendezvous" t
 WHERE d."typeId" IS NULL;

DELETE FROM "disponibilites" WHERE "typeId" IS NULL;

ALTER TABLE "disponibilites" ALTER COLUMN "typeId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "disponibilites_typeId_jour_idx" ON "disponibilites"("typeId", "jour");

-- AddForeignKey
ALTER TABLE "disponibilites" ADD CONSTRAINT "disponibilites_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "types_rendezvous"("id") ON DELETE CASCADE ON UPDATE CASCADE;
