-- Les moyens de règlement, et les coordonnées où la chambre reçoit l'argent.
--
-- Deux moyens s'encaissent tout seuls (carte, mobile money) ; les cinq autres
-- se passent hors ligne et c'est l'équipe qui constate l'arrivée.

CREATE TYPE "ModeReglement" AS ENUM ('carte', 'mobile_money', 'virement', 'depot', 'especes', 'international', 'plateforme');

ALTER TYPE "PaiementStatut" ADD VALUE IF NOT EXISTS 'annonce' BEFORE 'reussie';

-- La table est née hier et ne porte que des essais : la colonne se convertit
-- sans reprise de données.
ALTER TABLE "paiements"
  ALTER COLUMN "mode" TYPE "ModeReglement"
  USING (CASE
    WHEN "mode" = 'international' THEN 'carte'
    WHEN "mode" = 'mobile_money' THEN 'mobile_money'
    ELSE 'virement'
  END)::"ModeReglement";

ALTER TABLE "paiements" ALTER COLUMN "invoiceId" DROP NOT NULL;

ALTER TABLE "paiements"
  ADD COLUMN "refBancaire" TEXT,
  ADD COLUMN "detail" JSONB,
  ADD COLUMN "annonceLe" TIMESTAMP(3),
  ADD COLUMN "confirmePar" TEXT,
  ADD COLUMN "memberId" TEXT;

CREATE INDEX "paiements_memberId_idx" ON "paiements"("memberId");
CREATE INDEX "paiements_statut_idx" ON "paiements"("statut");

ALTER TABLE "paiements" ADD CONSTRAINT "paiements_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "coordonnees_paiement" (
    "id" TEXT NOT NULL DEFAULT 'uniques',
    "titulaire" TEXT NOT NULL DEFAULT '',
    "banque" TEXT NOT NULL DEFAULT '',
    "agence" TEXT NOT NULL DEFAULT '',
    "rib" TEXT NOT NULL DEFAULT '',
    "iban" TEXT NOT NULL DEFAULT '',
    "bic" TEXT NOT NULL DEFAULT '',
    "mvola" TEXT NOT NULL DEFAULT '',
    "orangeMoney" TEXT NOT NULL DEFAULT '',
    "airtelMoney" TEXT NOT NULL DEFAULT '',
    "adresseBureau" TEXT NOT NULL DEFAULT '',
    "horaires" TEXT NOT NULL DEFAULT '',
    "plateformes" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordonnees_paiement_pkey" PRIMARY KEY ("id")
);
