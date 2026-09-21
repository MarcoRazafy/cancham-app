import { SECTEURS, estSecteur } from "@/lib/secteurs";

/**
 * Les options d'une liste déroulante de secteurs.
 *
 * Une fiche saisie avant la liste fermée peut porter un secteur qui n'y
 * figure pas : il reste proposé, comme choix actuel, pour que l'enregistrer
 * sans y toucher ne l'efface pas.
 */
export function OptionsSecteurs({
  actuel,
  vide = "Choisissez un secteur",
}: {
  actuel?: string | null;
  /** Libellé de l'option vide, ou `null` pour ne pas en proposer. */
  vide?: string | null;
}) {
  const hors = actuel && !estSecteur(actuel) ? actuel : null;
  return (
    <>
      {vide !== null ? <option value="">{vide}</option> : null}
      {SECTEURS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
      {hors ? <option value={hors}>{hors} (actuel)</option> : null}
    </>
  );
}
