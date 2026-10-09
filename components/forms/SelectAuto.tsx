"use client";

export function SelectAuto({
  name,
  valeur,
  libelle,
  options,
}: {
  name: string;
  valeur: string;
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
