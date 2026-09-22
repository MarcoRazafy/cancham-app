"use client";

import { Globe, LockKeyhole } from "lucide-react";

const OPTIONS = [
  {
    valeur: "plateforme",
    titre: "Plateforme uniquement",
    detail: "Réservé aux membres connectés.",
    Icone: LockKeyhole,
  },
  {
    valeur: "public",
    titre: "Plateforme et page publique",
    detail: "Aussi sur la page publique, visible de tous.",
    Icone: Globe,
  },
] as const;

/**
 * Où paraît une publication — actualité ou événement : sur la plateforme
 * seulement, ou aussi sur la page publique. Deux cartes à cocher ; le champ
 * envoyé s'appelle `diffusion` et vaut « plateforme » ou « public ».
 */
export function ChoixDiffusion({
  publique,
  onChange,
}: {
  /** Choix de départ : `true` pour la page publique. */
  publique: boolean;
  /** Pour qu'un formulaire adapte ses champs, le tarif public par exemple. */
  onChange?: (publique: boolean) => void;
}) {
  return (
    <fieldset className="m-0 p-0 border-0 min-w-0">
      <legend className="sr-only">Diffusion</legend>
      <div className="flex flex-col gap-2.5">
        {OPTIONS.map(({ valeur, titre, detail, Icone }) => (
          <label
            key={valeur}
            className="flex gap-3 items-start rounded-[var(--radius-s)] border border-line bg-surface px-3.5 py-3 cursor-pointer hover:border-faint has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
          >
            <input
              type="radio"
              name="diffusion"
              value={valeur}
              defaultChecked={(valeur === "public") === publique}
              onChange={() => onChange?.(valeur === "public")}
              className="mt-0.5 w-4 h-4 accent-[var(--accent)] cursor-pointer shrink-0"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-[13.4px] font-semibold text-ink">
                <Icone size={14} className="shrink-0 text-muted" />
                {titre}
              </span>
              <span className="block text-[12.3px] text-muted mt-0.5">
                {detail}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
