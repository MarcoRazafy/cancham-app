-- Les trois portefeuilles mobiles, chacun à son nom.
--
-- « mobile_money » recouvrait Telma, Orange et Airtel : le membre ne pouvait
-- pas dire lequel il utilisait, et l'équipe voyait arriver un règlement sans
-- savoir sur quel numéro le chercher. PostgreSQL ne sait pas retirer une
-- valeur d'un type énuméré : on en bâtit un neuf, on y bascule la colonne, et
-- les règlements déjà ouverts en « mobile_money » deviennent des MVola — le
-- seul portefeuille que la chambre ait renseigné jusqu'ici.
CREATE TYPE "ModeReglement_nouveau" AS ENUM (
  'mvola',
  'orange_money',
  'airtel_money',
  'virement',
  'depot',
  'especes',
  'carte',
  'international',
  'plateforme'
);

ALTER TABLE "paiements"
  ALTER COLUMN "mode" TYPE "ModeReglement_nouveau"
  USING (
    CASE "mode"::text
      WHEN 'mobile_money' THEN 'mvola'
      ELSE "mode"::text
    END
  )::"ModeReglement_nouveau";

DROP TYPE "ModeReglement";

ALTER TYPE "ModeReglement_nouveau" RENAME TO "ModeReglement";
