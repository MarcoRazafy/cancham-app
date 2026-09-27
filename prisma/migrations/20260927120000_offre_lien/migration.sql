-- Une offre peut porter le lien où l'on en profite : page de commande,
-- formulaire, offre détaillée. Sans lien, on écrit au contact de l'entreprise.
ALTER TABLE "offers" ADD COLUMN "lien" TEXT;
