-- Une demande refusée garde son dossier.
--
-- Elle était effacée, et seul le journal en gardait le nom : l'équipe ne
-- pouvait ni revoir ce qu'elle avait écarté, ni revenir sur sa décision.

ALTER TYPE "MemberStatus" ADD VALUE IF NOT EXISTS 'refusee' AFTER 'candidature';
