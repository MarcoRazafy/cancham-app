-- Tentatives de règlement en ligne, chez Vanilla Pay.
--
-- Une ligne par tentative : un membre dont la carte est refusée recommence,
-- et la notification du prestataire retrouve la sienne par sa référence.

CREATE TYPE "PaiementStatut" AS ENUM ('en_cours', 'reussie', 'echouee', 'abandonnee');

CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "statut" "PaiementStatut" NOT NULL DEFAULT 'en_cours',
    "montant" INTEGER NOT NULL,
    "devise" "Devise" NOT NULL DEFAULT 'MGA',
    "mode" TEXT NOT NULL,
    "transaction" TEXT,
    "notification" JSONB,
    "regleLe" TIMESTAMP(3),
    "invoiceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "paiements_reference_key" ON "paiements"("reference");
CREATE INDEX "paiements_invoiceId_idx" ON "paiements"("invoiceId");

ALTER TABLE "paiements" ADD CONSTRAINT "paiements_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
