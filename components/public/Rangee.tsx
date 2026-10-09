import { Children, type CSSProperties, type ReactNode } from "react";

export function Rangee({
  ecart,
  largeur,
  className = "",
  children,
}: {
  ecart: number;
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

export const SURVOL_CARTE =
  "transition-[scale] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:scale-[1.04] motion-reduce:transition-none";
