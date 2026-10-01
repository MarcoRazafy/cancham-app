import { Children, type CSSProperties, type ReactNode } from "react";

/**
 * Rangée de cartes, immobile.
 *
 * Sur ordinateur, toutes les cartes tiennent de front — trois ou quatre —
 * et rien ne bouge. Sur un écran plus étroit, la rangée se fait glisser à la
 * main, comme un carrousel : une carte entière, et la suivante qui dépasse
 * pour y inviter. Les largeurs se mesurent en `cqw`, sur le cadre.
 *
 * La carte survolée grandit (`SURVOL_CARTE`) ; le cadre garde un peu de
 * marge autour d'elle pour qu'elle ne soit pas rognée.
 */
export function Rangee({
  ecart,
  largeur,
  className = "",
  children,
}: {
  /** L'écart entre deux cartes, en pixels. */
  ecart: number;
  /** La largeur d'une carte, en classes — `cqw` se rapporte au cadre. */
  largeur: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div
        className="rangee @container -mx-2 -my-3 overflow-x-auto px-2 py-3"
        style={{ "--ecart": `${ecart}px` } as CSSProperties}
      >
        <ul className="m-0 flex w-max list-none gap-[var(--ecart)] p-0">
          {Children.toArray(children).map((carte, i) => (
            <li key={i} className={`shrink-0 snap-start ${largeur}`}>
              {carte}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Le survol d'une carte : elle grandit d'un vingt-cinquième. */
export const SURVOL_CARTE =
  "transition-[scale] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:scale-[1.04] motion-reduce:transition-none";
