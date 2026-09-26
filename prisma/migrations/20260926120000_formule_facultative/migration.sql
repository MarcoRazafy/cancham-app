-- La formule d'adhésion n'est plus imposée à la création.
--
-- Une demande déposée sur la vitrine n'en indique aucune : le candidat la
-- choisit en complétant son dossier. La valeur par défaut faisait passer tout
-- le monde pour « Madagascar — Entreprise », et la chambre semblait attendre
-- 500 000 Ar de quelqu'un qui n'avait rien choisi.
--
-- Les fiches existantes gardent leur formule : seule la contrainte tombe.

ALTER TABLE "members" ALTER COLUMN "formule" DROP NOT NULL;
ALTER TABLE "members" ALTER COLUMN "formule" DROP DEFAULT;
