"use client";

import { useRef, useState } from "react";

/**
 * L'adresse de facturation, proposée d'office et modifiable.
 *
 * On part de ce que la fiche de l'entreprise sait — la ville et le pays —
 * pour que le membre n'ait rien à taper dans le cas courant. « Modifier »
 * ouvre le champ ; sans adresse connue, il est ouvert d'emblée.
 */
export function AdresseFacturation({ initiale }: { initiale: string }) {
  const [edition, setEdition] = useState(!initiale);
  const [valeur, setValeur] = useState(initiale);
  const champ = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label
        htmlFor="adresse-facturation"
        className="mb-1.5 block text-[14px] font-semibold text-ink"
      >
        Adresse de facturation
      </label>
      {edition ? (
        <input
          ref={champ}
          id="adresse-facturation"
          name="adresse"
          required
          maxLength={200}
          autoComplete="street-address"
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          placeholder="Rue, quartier, ville"
          className="min-h-12 w-full rounded-[var(--radius-m)] border border-line bg-surface px-4 text-[16px] text-ink placeholder:text-faint focus:border-accent focus:outline-none"
        />
      ) : (
        <div className="flex min-h-12 items-center gap-3 rounded-[var(--radius-m)] border border-line bg-surface px-4">
          <input type="hidden" name="adresse" value={valeur} />
          <span
            id="adresse-facturation"
            className="min-w-0 flex-1 truncate text-[15px] text-ink"
          >
            {valeur}
          </span>
          <button
            type="button"
            onClick={() => {
              setEdition(true);
              // Le champ n'existe qu'au rendu suivant : on attend qu'il soit
              // là pour y poser le curseur.
              requestAnimationFrame(() => champ.current?.focus());
            }}
            className="min-h-11 shrink-0 cursor-pointer border-0 bg-transparent px-1 text-[14px] font-semibold text-accent hover:underline"
          >
            Modifier
          </button>
        </div>
      )}
    </div>
  );
}
