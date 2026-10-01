-- Les publications libres des membres sont réservées aux membres. Pendant
-- quelques heures, la fenêtre de publication a proposé « Public » : celles
-- qui l'ont choisi quittent la page publique. Les articles de la chambre,
-- et ceux que l'équipe a titrés, ne sont pas touchés.
UPDATE "news"
SET "public" = false
WHERE "memberId" IS NOT NULL AND "libre" = true AND "public" = true;
