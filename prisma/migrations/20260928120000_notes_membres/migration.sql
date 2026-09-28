-- Notes de l'équipe sur un membre, dans sa fiche d'annuaire.
--
-- Internes : jamais lues par l'espace membre. C'est le carnet de l'équipe,
-- et l'intéressé ne doit pas le voir.

CREATE TABLE "notes_membres" (
    "id" TEXT NOT NULL,
    "texte" TEXT NOT NULL,
    "auteur" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_membres_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notes_membres_memberId_idx" ON "notes_membres"("memberId");

ALTER TABLE "notes_membres" ADD CONSTRAINT "notes_membres_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notes_membres" ADD CONSTRAINT "notes_membres_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
