"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Boîte de dialogue déclenchée par un bouton.
 *
 * Elle s'appuie sur l'élément `<dialog>` natif : la touche Échap, le piège à
 * focus et le fond modal sont gérés par le navigateur, sans bibliothèque.
 *
 * L'ouverture passe par un état plutôt que par un appel direct sur la ref :
 * l'effet est le seul endroit où l'on touche au DOM.
 */
export function Modal({
  trigger,
  title,
  children,
  wide = false,
  ouvert: ouvertImpose,
  onFermer,
}: {
  /** Absent quand l'ouverture est pilotée par le parent (`ouvert`). */
  trigger?: (ouvrir: () => void) => ReactNode;
  title: string;
  /** Reçoit la fonction de fermeture, à passer au formulaire. */
  children: (fermer: () => void) => ReactNode;
  wide?: boolean;
  /**
   * Ouverture pilotée par le parent. Utile quand le bouton déclencheur
   * disparaît au clic — l'entrée d'un menu, par exemple — et emporterait la
   * boîte avec lui.
   */
  ouvert?: boolean;
  onFermer?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [ouvertInterne, setOuvertInterne] = useState(false);
  const pilote = ouvertImpose !== undefined;
  const ouvert = pilote ? ouvertImpose : ouvertInterne;
  const setOuvert = (o: boolean) => {
    if (!pilote) setOuvertInterne(o);
    else if (!o) onFermer?.();
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (ouvert && !el.open) el.showModal();
    if (!ouvert && el.open) el.close();
  }, [ouvert]);

  return (
    <>
      {trigger?.(() => setOuvert(true))}
      <dialog
        ref={ref}
        onClose={() => setOuvert(false)}
        onCancel={() => setOuvert(false)}
        onClick={(e) => {
          // Un clic sur le fond, en dehors du panneau, referme.
          if (e.target === e.currentTarget) setOuvert(false);
        }}
        className={`m-auto w-[calc(100vw-32px)] ${
          wide ? "max-w-[680px]" : "max-w-[560px]"
        } rounded-[var(--radius-l)] border border-line bg-surface text-ink p-0 backdrop:bg-black/55 backdrop:backdrop-blur-[2px]`}
      >
        {ouvert ? (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h3 className="m-0 text-[16.5px] font-semibold font-[family-name:var(--font-display)]">
                {title}
              </h3>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                aria-label="Fermer"
                className="border border-line bg-surface w-9 h-9 rounded-[var(--radius-s)] flex items-center justify-center cursor-pointer text-muted hover:text-ink"
              >
                <X size={15} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {children(() => setOuvert(false))}
            </div>
          </>
        ) : null}
      </dialog>
    </>
  );
}
