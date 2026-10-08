"use client";

import { Palette } from "lucide-react";
import { PALETTE_TEXTE } from "@/lib/blocs";

/**
 * La ligne des couleurs de l'éditeur de page : la palette de la charte, une
 * couleur libre, et le retour à la couleur par défaut.
 *
 * La même pour un bloc de texte, où elle colore la sélection, et pour un
 * titre, qu'elle colore en entier. Les pastilles ne prennent pas le
 * curseur : on continue d'écrire là où l'on était.
 */
export function ChoixCouleur({
  libelle,
  actuelle,
  onChoisir,
  className = "",
}: {
  /** Ce que la ligne colore : « Couleur du texte », « Couleur du titre ». */
  libelle: string;
  /**
   * La couleur en place, pour la marquer. À laisser de côté quand elle
   * dépend de ce qui est sélectionné.
   */
  actuelle?: string | null;
  /** `null` : revenir à la couleur par défaut. */
  onChoisir: (couleur: string | null) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={libelle}
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      <span className="flex items-center gap-1.5 pr-0.5 text-[12px] font-semibold text-muted">
        <Palette size={14} /> Couleur
      </span>
      {PALETTE_TEXTE.map((c) => {
        const enPlace = actuelle === c.valeur;
        return (
          <button
            key={c.valeur}
            type="button"
            title={c.nom}
            aria-label={c.nom}
            aria-pressed={actuelle === undefined ? undefined : enPlace}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChoisir(c.valeur)}
            className={`h-7 w-7 rounded-full border border-black/10 shadow-sm hover:scale-110 ${
              enPlace
                ? "ring-2 ring-ink/60 ring-offset-2 ring-offset-surface"
                : ""
            }`}
            style={{ background: c.valeur }}
          />
        );
      })}
      <label
        title="Choisir une autre couleur"
        className="flex h-7 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface-2 pl-1 pr-2.5 text-[12px] font-semibold text-ink"
      >
        <input
          type="color"
          aria-label="Autre couleur"
          defaultValue={actuelle ?? "#ad0707"}
          // L'événement natif `change` : une fois la couleur arrêtée, pas à
          // chaque mouvement dans le nuancier — reprendre le curseur à ce
          // moment-là fermerait le nuancier.
          ref={(el) => {
            if (el) el.onchange = () => onChoisir(el.value);
          }}
          className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0"
        />
        Personnalisée
      </label>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChoisir(null)}
        className="h-7 rounded-full border border-line px-2.5 text-[12px] font-semibold text-muted hover:text-ink"
      >
        Par défaut
      </button>
    </div>
  );
}
