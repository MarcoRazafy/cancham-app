-- Secteurs d'activité : passage à une liste fermée (lib/secteurs.ts).
-- Les anciens libellés, saisis librement, rejoignent le secteur le plus
-- proche. Un libellé inconnu n'est pas touché : la fiche le garde, et
-- l'annuaire le propose à la suite de la liste.
UPDATE "members" SET "secteur" = CASE "secteur"
  WHEN 'Agroalimentaire & export' THEN 'Agribusiness'
  WHEN 'Huiles essentielles & produits naturels' THEN 'Agribusiness'
  WHEN 'Artisanat & savoir-faire malgache' THEN 'Artisanat'
  WHEN 'Tourisme & voyagisme' THEN 'Tourisme'
  WHEN 'Technologie & BPO' THEN 'Digital'
  WHEN 'Ressources & mines' THEN 'Mines et ressources naturelles'
  WHEN 'Éducation & formation professionnelle' THEN 'Formation & accompagnement'
  WHEN 'Conseil en développement international' THEN 'Formation & accompagnement'
  WHEN 'Design & aménagement intérieur' THEN 'Autres services'
  WHEN 'Autre secteur' THEN 'Autres services'
  ELSE "secteur"
END
WHERE "secteur" IN (
  'Agroalimentaire & export',
  'Huiles essentielles & produits naturels',
  'Artisanat & savoir-faire malgache',
  'Tourisme & voyagisme',
  'Technologie & BPO',
  'Ressources & mines',
  'Éducation & formation professionnelle',
  'Conseil en développement international',
  'Design & aménagement intérieur',
  'Autre secteur'
);
