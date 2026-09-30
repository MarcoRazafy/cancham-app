import { Children, type CSSProperties, type ReactNode } from "react";

/**
 * Rangée de cartes qui glisse toute seule, en boucle (`vitrine.css`).
 *
 * La piste porte deux fois les cartes : à mi-course, elle est revenue à son
 * point de départ, et la boucle ne se voit pas. Pour que la couture tombe
 * juste, chaque groupe se termine par un écart — le même qu'entre deux
 * cartes — et la largeur des cartes se mesure en `cqw`, sur ce cadre :
 * trois cartes et trois écarts font exactement la largeur du cadre plus un
 * écart, soit la moitié de la piste.
 *
 * La copie est cachée aux lecteurs d'écran : ce sont les mêmes personnes.
 * Passer la souris sur la rangée l'arrête ; la carte survolée grandit
 * (`SURVOL_CARTE`), et le cadre garde un peu de marge en haut et en bas pour
 * qu'elle ne soit pas rognée.
 */
export function Defile({
  sens = "gauche",
  ecart,
  largeur,
  className = "",
  children,
}: {
  /** Vers où glisse la rangée. */
  sens?: "gauche" | "droite";
  /** L'écart entre deux cartes, en pixels. */
  ecart: number;
  /** La largeur d'une carte, en classes — `cqw` se rapporte au cadre. */
  largeur: string;
  className?: string;
  children: ReactNode;
}) {
  const cartes = Children.toArray(children);
  const groupe = (copie: boolean) => (
    <ul
      aria-hidden={copie || undefined}
      className={`m-0 p-0 list-none flex gap-[var(--ecart)] pr-[var(--ecart)] ${
        copie ? "defile-copie" : ""
      }`}
    >
      {cartes.map((carte, i) => (
        <li key={i} className={`shrink-0 ${largeur}`}>
          {carte}
        </li>
      ))}
    </ul>
  );

  return (
    <div className={className}>
      <div
        className={`defile @container overflow-hidden py-3 -my-3 ${
          sens === "droite" ? "defile-droite" : ""
        }`}
        style={{ "--ecart": `${ecart}px` } as CSSProperties}
      >
        <div className="defile-piste flex w-max">
          {groupe(false)}
          {groupe(true)}
        </div>
      </div>
    </div>
  );
}

/** Le survol d'une carte qui défile : elle grandit d'un vingt-cinquième. */
export const SURVOL_CARTE =
  "transition-[scale] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:scale-[1.04] motion-reduce:transition-none";
