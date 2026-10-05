-- La facture imprime désormais « Paiement reçu le… » : on garde le jour où
-- le règlement a été reçu. Jusqu'ici, il ne se lisait que sur le règlement
-- en ligne ou dans le journal.

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "payeeLe" DATE;

-- Les factures déjà payées retrouvent leur jour de règlement, de la source
-- la plus sûre à la moins sûre.

-- 1. Un règlement confirmé, en ligne ou par l'équipe : le jour où il l'a
--    été, à l'heure de Madagascar (les horodatages sont rangés en UTC).
UPDATE "invoices" i
SET "payeeLe" = r."jour"
FROM (
  SELECT
    "invoiceId",
    max(("regleLe" AT TIME ZONE 'UTC') AT TIME ZONE 'Indian/Antananarivo')::date AS "jour"
  FROM "paiements"
  WHERE "statut" = 'reussie' AND "regleLe" IS NOT NULL AND "invoiceId" IS NOT NULL
  GROUP BY "invoiceId"
) r
WHERE r."invoiceId" = i."id" AND i."statut" = 'payee';

-- 2. Une facture marquée payée après coup par l'équipe : le jour qu'elle a
--    saisi, que seul le journal avait gardé (« … le 22/09/2026 pour … »).
UPDATE "invoices" i
SET "payeeLe" = to_date(j."jour", 'DD/MM/YYYY')
FROM (
  SELECT DISTINCT ON ("entiteId")
    "entiteId",
    substring("detail" from ' le (\d{1,2}/\d{1,2}/\d{4}) pour ') AS "jour"
  FROM "audit_logs"
  WHERE "entite" = 'Invoice' AND "action" = 'facture_payee'
  ORDER BY "entiteId", "createdAt" DESC
) j
WHERE j."entiteId" = i."numero"
  AND i."statut" = 'payee'
  AND i."payeeLe" IS NULL
  AND j."jour" IS NOT NULL;

-- 3. Le reste — une facture émise déjà réglée : sa propre date.
UPDATE "invoices"
SET "payeeLe" = "date"
WHERE "statut" = 'payee' AND "payeeLe" IS NULL;
