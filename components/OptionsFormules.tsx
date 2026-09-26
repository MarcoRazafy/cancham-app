import {
  fmtCotisation,
  libelleFormule,
  ORDRE_FORMULES,
} from "@/lib/membership";

/**
 * Les options d'une liste déroulante de formules d'adhésion, tarif compris.
 *
 * Le tarif est écrit en face du libellé : c'est lui que l'équipe cherche en
 * ouvrant la liste, et il évite de retenir quelle formule vaut quoi.
 *
 * Les formules viennent de `ORDRE_FORMULES`, donc de la grille elle-même :
 * une formule ajoutée à la grille apparaît ici sans rien à recopier.
 */
export function OptionsFormules({
  vide,
}: {
  /** Libellé d'une option vide, pour une formule pas encore choisie. */
  vide?: string;
}) {
  return (
    <>
      {vide ? <option value="">{vide}</option> : null}
      {ORDRE_FORMULES.map((f) => (
        <option key={f} value={f}>
          {libelleFormule(f)} — {fmtCotisation(f)} / an
        </option>
      ))}
    </>
  );
}
