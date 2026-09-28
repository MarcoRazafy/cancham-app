"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Une coordonnée à recopier dans sa banque.
 *
 * Le bouton compte autant que la valeur : un IBAN retapé à la main se trompe
 * d'un caractère une fois sur dix, et le virement part alors ailleurs.
 */
export function Copiable({
  libelle,
  valeur,
  mono = true,
  accent = false,
}: {
  libelle: string;
  valeur: string;
  /** En chasse fixe : pour ce qui se lit chiffre par chiffre. */
  mono?: boolean;
  /** Mis en avant : la référence du motif, que tout le reste sert. */
  accent?: boolean;
}) {
  const [copie, setCopie] = useState(false);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(valeur);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papier refusé — la valeur reste lisible et sélectionnable.
    }
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-[var(--radius-m)] border px-4 py-3 ${
        accent
          ? "border-accent/40 bg-accent-soft"
          : "border-line bg-surface-2"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-faint">
          {libelle}
        </div>
        <div
          className={`mt-0.5 break-words text-ink ${
            mono
              ? "font-[family-name:var(--font-mono)] text-[14.5px]"
              : "text-[14.5px] font-semibold"
          } ${accent ? "text-accent" : ""}`}
        >
          {valeur}
        </div>
      </div>
      <button
        type="button"
        onClick={copier}
        aria-label={`Copier ${libelle.toLowerCase()}`}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-s)] border border-line bg-surface px-3 py-1.5 text-[12.4px] font-semibold text-ink hover:border-faint"
      >
        {copie ? (
          <>
            <Check size={13} className="text-success-strong" /> Copié
          </>
        ) : (
          <>
            <Copy size={13} /> Copier
          </>
        )}
      </button>
    </div>
  );
}
