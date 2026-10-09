import { SECTEURS, estSecteur } from "@/lib/secteurs";

export function OptionsSecteurs({
  actuel,
  vide = "Choisissez un secteur",
}: {
  actuel?: string | null;
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
