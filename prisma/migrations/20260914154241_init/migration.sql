-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('candidature', 'en_attente', 'a_jour', 'en_retard');

-- CreateEnum
CREATE TYPE "MemberType" AS ENUM ('morale', 'physique');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('visiteur', 'membre', 'admin');

-- CreateEnum
CREATE TYPE "EventFormat" AS ENUM ('Présentiel', 'Webinaire', 'Hybride');

-- CreateEnum
CREATE TYPE "AttendeeStatus" AS ENUM ('confirmé', 'présent', 'absent');

-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('Programmation', 'Événement passé', 'Vie de la chambre', 'Formation');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('image', 'video');

-- CreateEnum
CREATE TYPE "MediaTheme" AS ENUM ('navy', 'green');

-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('Guide', 'Modèle', 'Formation', 'Rapport');

-- CreateEnum
CREATE TYPE "ResourceFormat" AS ENUM ('PDF', 'DOCX', 'Vidéo');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('gratuit', 'payant');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('payee', 'envoyee');

-- CreateEnum
CREATE TYPE "ThreadType" AS ENUM ('individuel', 'groupe');

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "type" "MemberType" NOT NULL DEFAULT 'morale',
    "nom" TEXT NOT NULL,
    "secteur" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "statut" "MemberStatus" NOT NULL DEFAULT 'candidature',
    "adhesion" DATE NOT NULL,
    "retardDepuis" DATE,
    "activite" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "besoins" TEXT,
    "interets" TEXT,
    "statutJuridique" TEXT,
    "pays" TEXT,
    "siteweb" TEXT,
    "motivation" TEXT,
    "paiementNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'membre',
    "nom" TEXT NOT NULL,
    "fonction" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tel" TEXT,
    "memberId" TEXT,
    "contactPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "photo" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "lieu" TEXT NOT NULL,
    "format" "EventFormat" NOT NULL,
    "cap" INTEGER NOT NULL,
    "payant" BOOLEAN NOT NULL DEFAULT false,
    "prix" INTEGER NOT NULL DEFAULT 0,
    "desc" TEXT NOT NULL,
    "photo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendees" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "entreprise" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "statut" "AttendeeStatus" NOT NULL DEFAULT 'confirmé',
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "cat" "NewsCategory" NOT NULL,
    "extrait" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "mediaTheme" "MediaTheme" NOT NULL,
    "mediaDuration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "cat" "ResourceCategory" NOT NULL,
    "fmt" "ResourceFormat" NOT NULL,
    "taille" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "PricingType" NOT NULL DEFAULT 'gratuit',
    "prix" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "auteur" TEXT NOT NULL,
    "entreprise" TEXT NOT NULL,
    "texte" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "newsId" TEXT,
    "resourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancham_services" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "type" "PricingType" NOT NULL DEFAULT 'gratuit',
    "prix" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT NOT NULL DEFAULT 'award',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cancham_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "objet" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "statut" "InvoiceStatus" NOT NULL DEFAULT 'envoyee',
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_threads" (
    "id" TEXT NOT NULL,
    "type" "ThreadType" NOT NULL,
    "nom" TEXT NOT NULL,
    "sousTitre" TEXT NOT NULL,
    "init" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "auteur" TEXT NOT NULL,
    "texte" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entite" TEXT NOT NULL,
    "entiteId" TEXT NOT NULL,
    "acteur" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "members_statut_idx" ON "members"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_memberId_idx" ON "users"("memberId");

-- CreateIndex
CREATE INDEX "produits_memberId_idx" ON "produits"("memberId");

-- CreateIndex
CREATE INDEX "events_date_idx" ON "events"("date");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_code_key" ON "registrations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_eventId_memberId_key" ON "registrations"("eventId", "memberId");

-- CreateIndex
CREATE INDEX "attendees_eventId_idx" ON "attendees"("eventId");

-- CreateIndex
CREATE INDEX "news_date_idx" ON "news"("date");

-- CreateIndex
CREATE INDEX "resources_type_idx" ON "resources"("type");

-- CreateIndex
CREATE INDEX "comments_newsId_idx" ON "comments"("newsId");

-- CreateIndex
CREATE INDEX "comments_resourceId_idx" ON "comments"("resourceId");

-- CreateIndex
CREATE INDEX "offers_memberId_idx" ON "offers"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_numero_key" ON "invoices"("numero");

-- CreateIndex
CREATE INDEX "invoices_memberId_idx" ON "invoices"("memberId");

-- CreateIndex
CREATE INDEX "messages_threadId_idx" ON "messages"("threadId");

-- CreateIndex
CREATE INDEX "audit_logs_entite_entiteId_idx" ON "audit_logs"("entite", "entiteId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits" ADD CONSTRAINT "produits_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
