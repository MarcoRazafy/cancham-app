"use client";

export function FiltreTarif({
  actif,
  options,
}: {
  actif: string;
  options: { key: string; label: string; compte?: number }[];
}) {
  return (
    <select
      name="type"
      defaultValue={actif}
      aria-label="Filtrer par tarif"
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="rounded-[var(--radius-s)] border border-line bg-surface px-3 py-2 text-[13.2px] font-semibold text-ink"
    >
      {options.map((o) => (
        <option key={o.key} value={o.key}>
          {o.compte === undefined ? o.label : `${o.label} (${o.compte})`}
        </option>
      ))}
    </select>
  );
}
