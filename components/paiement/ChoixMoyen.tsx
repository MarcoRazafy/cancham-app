"use client";

import { IconeMode } from "@/components/paiement/IconeMode";
import { MODES, type ModeReglement } from "@/lib/modes-reglement";

/**
 * « Comment paierez-vous ? », en tuiles à cocher.
 *
 * Pour les formulaires qui font autre chose en même temps — s'inscrire à un
 * événement, acheter une ressource : le moyen part avec le reste, sous le nom
 * `mode`, et la page qui suit donne les coordonnées et la référence.
 *
 * Seuls les moyens dont la chambre a renseigné les coordonnées arrivent ici :
 * un choix plus court vaut mieux qu'un virement envoyé dans le vide.
 */
export function ChoixMoyen({
  modes,
  defaut,
}: {
  modes: ModeReglement[];
  /** Coché d'office, quand on revient sur un moyen déjà choisi. */
  defaut?: ModeReglement;
}) {
  if (!modes.length) return null;
  return (
    <fieldset className="m-0 p-0 border-0 min-w-0">
      <legend className="mb-1.5 block text-[12.8px] font-semibold text-ink">
        Mode de paiement
      </legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {modes.map((m) => (
          <label
            key={m}
            title={MODES[m].detail}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-[var(--radius-s)] border border-line bg-surface px-2.5 py-3 text-center hover:border-faint has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
          >
            {/*
              La case est là pour le clavier et les lecteurs d'écran ; c'est
              la tuile entière qui se coche à la souris.
            */}
            <input
              type="radio"
              name="mode"
              value={m}
              required
              defaultChecked={m === defaut}
              className="sr-only"
            />
            <IconeMode mode={m} size={19} />
            <span className="text-[12.2px] font-semibold leading-tight text-ink">
              {MODES[m].titre}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
