import {
  ORDRE_FORMULES,
  fmtCotisation,
  libelleFormule,
  type FormuleId,
} from "@/lib/membership";

/**
 * Choix de la formule d'adhésion, commun aux deux formulaires publics.
 *
 * Chaque option porte son tarif, comme la grille de la fiche d'inscription :
 * le candidat choisit en sachant ce qu'il s'engage à payer. La liste vient de
 * `FORMULES` — un changement de tarif n'a qu'un endroit où être fait.
 */
export function ChoixFormule({
  id,
  className,
  defaut = "mg_entreprise",
}: {
  id: string;
  className: string;
  defaut?: FormuleId;
}) {
  return (
    <select
      id={id}
      name="formule"
      required
      defaultValue={defaut}
      className={className}
      style={{ colorScheme: "light" }}
    >
      {ORDRE_FORMULES.map((f) => (
        <option key={f} value={f}>
          {libelleFormule(f)} — {fmtCotisation(f)} / an
        </option>
      ))}
    </select>
  );
}

// La liste des pays vit avec les autres valeurs de la fiche.
export { PAYS } from "@/lib/accueil";
