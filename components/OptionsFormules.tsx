import {
  fmtCotisation,
  libelleFormule,
  ORDRE_FORMULES,
} from "@/lib/membership";

export function OptionsFormules({ vide }: { vide?: string }) {
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
