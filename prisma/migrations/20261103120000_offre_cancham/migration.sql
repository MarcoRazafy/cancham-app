-- Une offre peut être proposée par la CanCham elle-même : sans membre.
ALTER TABLE "offers" ALTER COLUMN "memberId" DROP NOT NULL;
