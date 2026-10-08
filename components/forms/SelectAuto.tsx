"use client";

/**
 * Une liste déroulante qui soumet son formulaire dès qu'on choisit : un
 * bouton « Appliquer » de plus n'apprendrait rien à personne, et le choix
 * part dans l'adresse, donc il se partage et survit au rechargement.
 */
export function SelectAuto({
  name,
  valeur,
  libelle,
  options,
}: {
  name: string;
  valeur: string;
  /** Ce que la liste règle, pour les lecteurs d'écran. */
  libelle: string;
  options: { key: string; label: string }[];
}) {
  return (
    <select
      name={name}
      defaultValue={valeur}
      aria-label={libelle}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="rounded-[var(--radius-s)] border border-line bg-surface px-3 py-2 text-[13.2px] font-semibold text-ink"
    >
      {options.map((o) => (
        <option key={o.key} value={o.key}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
