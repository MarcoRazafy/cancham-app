-- Le virement international n'est plus proposé.
--
-- Aucun règlement ne l'utilise : on reconstruit le type sans lui, comme
-- pour la séparation des portefeuilles — PostgreSQL ne sait pas retirer une
-- valeur d'un type énuméré.
CREATE TYPE "ModeReglement_nouveau" AS ENUM (
  'mvola',
  'orange_money',
  'airtel_money',
  'virement',
  'depot',
  'especes',
  'carte',
  'plateforme'
);

ALTER TABLE "paiements"
  ALTER COLUMN "mode" TYPE "ModeReglement_nouveau"
  USING ("mode"::text)::"ModeReglement_nouveau";

DROP TYPE "ModeReglement";

ALTER TYPE "ModeReglement_nouveau" RENAME TO "ModeReglement";
