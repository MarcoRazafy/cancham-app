-- Repris de la plateforme L’Alliée Virtuelle : newsletter (lettres, suivi des envois),
-- tags (manuels et automatiques, sur les entreprises et les événements), événements
-- (intervenants, rappels aux inscrits) et rendez-vous (personnes qui reçoivent).

-- AlterTable
ALTER TABLE "abonnes" ADD COLUMN     "erreurLe" TIMESTAMP(3),
ADD COLUMN     "inviteLe" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "etiquettes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "rappelH2" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rappelJ1" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rappelJ7" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rappelMessage" TEXT,
ADD COLUMN     "rappelSujet" TEXT;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "etiquettes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "rendezvous" ADD COLUMN     "confirmeLe" TIMESTAMP(3),
ADD COLUMN     "hoteId" TEXT,
ADD COLUMN     "lienVisio" TEXT,
ADD COLUMN     "lieu" TEXT NOT NULL DEFAULT 'bureau',
ADD COLUMN     "statut" TEXT NOT NULL DEFAULT 'confirme';

-- AlterTable
ALTER TABLE "types_rendezvous" ADD COLUMN     "aConfirmer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "couleur" TEXT,
ADD COLUMN     "hoteId" TEXT,
ADD COLUMN     "lieu" TEXT NOT NULL DEFAULT 'bureau',
ADD COLUMN     "prix" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lienVisio" TEXT,
ADD COLUMN     "recoitRdv" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "specialite" TEXT;

-- CreateTable
CREATE TABLE "rappels_envoyes" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "envoyeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rappels_envoyes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_intervenants" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "fonction" TEXT,
    "entreprise" TEXT,
    "bio" TEXT,
    "photo" TEXT,
    "ordre" INTEGER NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "event_intervenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rappels_evenement" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "titre" TEXT,
    "dates" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
    "avant" INTEGER NOT NULL DEFAULT 0,
    "sujet" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rappels_evenement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lettres" (
    "id" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "audience" JSONB NOT NULL DEFAULT '{}',
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "destinataires" INTEGER NOT NULL DEFAULT 0,
    "envoyes" INTEGER NOT NULL DEFAULT 0,
    "envoyeeLe" TIMESTAMP(3),
    "programmeeLe" TIMESTAMP(3),
    "auteur" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lettres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "envois_lettres" (
    "id" TEXT NOT NULL,
    "lettreId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "resendId" TEXT,
    "livreLe" TIMESTAMP(3),
    "ouvertLe" TIMESTAMP(3),
    "clicLe" TIMESTAMP(3),
    "erreurLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "envois_lettres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regles_tags" (
    "id" TEXT NOT NULL,
    "statut" "MemberStatus" NOT NULL,
    "tag" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regles_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rappels_envoyes_eventId_type_email_key" ON "rappels_envoyes"("eventId", "type", "email");

-- CreateIndex
CREATE INDEX "event_intervenants_eventId_ordre_idx" ON "event_intervenants"("eventId", "ordre");

-- CreateIndex
CREATE INDEX "rappels_evenement_eventId_idx" ON "rappels_evenement"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "envois_lettres_resendId_key" ON "envois_lettres"("resendId");

-- CreateIndex
CREATE INDEX "envois_lettres_lettreId_idx" ON "envois_lettres"("lettreId");

-- CreateIndex
CREATE INDEX "envois_lettres_email_idx" ON "envois_lettres"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tags_nom_key" ON "tags"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "regles_tags_statut_tag_key" ON "regles_tags"("statut", "tag");

-- AddForeignKey
ALTER TABLE "types_rendezvous" ADD CONSTRAINT "types_rendezvous_hoteId_fkey" FOREIGN KEY ("hoteId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendezvous" ADD CONSTRAINT "rendezvous_hoteId_fkey" FOREIGN KEY ("hoteId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rappels_envoyes" ADD CONSTRAINT "rappels_envoyes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_intervenants" ADD CONSTRAINT "event_intervenants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rappels_evenement" ADD CONSTRAINT "rappels_evenement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envois_lettres" ADD CONSTRAINT "envois_lettres_lettreId_fkey" FOREIGN KEY ("lettreId") REFERENCES "lettres"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Un créneau ne se réserve qu'une fois par personne qui reçoit (et une fois pour « l'équipe ») :
-- deux personnes différentes peuvent recevoir à la même heure. Index partiel, comme avant :
-- une annulation libère l'heure, et c'est la base qui arbitre entre deux clics simultanés.
DROP INDEX IF EXISTS "rendezvous_creneau_unique";
CREATE UNIQUE INDEX "rendezvous_creneau_unique"
  ON "rendezvous" (COALESCE("hoteId", ''), "jour", "debut")
  WHERE "annuleLe" IS NULL;

-- Règle par défaut : les membres à jour portent le tag « Membre à jour »
INSERT INTO "regles_tags" ("id", "statut", "tag") VALUES ('regle_membre_a_jour', 'a_jour', 'Membre à jour') ON CONFLICT DO NOTHING;
INSERT INTO "tags" ("id", "nom") VALUES ('tag_membre_a_jour', 'Membre à jour') ON CONFLICT ("nom") DO NOTHING;
