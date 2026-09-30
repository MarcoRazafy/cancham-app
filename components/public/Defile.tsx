"use client";

import {
  Children,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

/**
 * Rangée de cartes qui glisse toute seule, en boucle, et qu'on peut aussi
 * faire glisser à la main — au doigt sur téléphone, à la souris ou au pavé
 * tactile sur ordinateur.
 *
 * C'est un défilement horizontal natif, comme un carrousel, qu'une boucle
 * d'animation pousse d'une trentaine de pixels par seconde. La piste porte
 * trois fois les cartes et reste sur la copie du milieu : dès qu'on
 * s'approche d'un bout, elle saute d'une longueur de groupe — le contenu
 * étant le même, le saut ne se voit pas, et l'on peut glisser sans fin dans
 * les deux sens. Pour que la couture tombe juste, chaque groupe se termine
 * par un écart, le même qu'entre deux cartes, et les largeurs se mesurent
 * en `cqw`, sur le cadre.
 *
 * La poussée s'arrête tant que la souris survole la rangée ou qu'un doigt
 * la tient, et reprend un peu après le dernier geste ; elle ne démarre
 * jamais si la personne a demandé moins d'animations. Les copies sont
 * cachées aux lecteurs d'écran : ce sont les mêmes personnes.
 */

/** Pixels par seconde : ça se remarque sans gêner la lecture. */
const VITESSE = 34;
/** Millisecondes après le dernier geste avant que la rangée ne reparte. */
const REPRISE = 1800;

export function Defile({
  sens = "gauche",
  ecart,
  largeur,
  className = "",
  children,
}: {
  /** Vers où glisse la rangée d'elle-même. */
  sens?: "gauche" | "droite";
  /** L'écart entre deux cartes, en pixels. */
  ecart: number;
  /** La largeur d'une carte, en classes — `cqw` se rapporte au cadre. */
  largeur: string;
  className?: string;
  children: ReactNode;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  const cartes = Children.toArray(children);

  useEffect(() => {
    const el = cadre.current;
    if (!el) return;

    /** La longueur d'un groupe : cartes, écarts et l'écart de couture. */
    const groupe = () =>
      (el.firstElementChild?.firstElementChild as HTMLElement | null)
        ?.offsetWidth ?? 0;

    /** Ramène la piste sur la copie du milieu. Vrai si elle a sauté. */
    const recadrer = () => {
      const g = groupe();
      if (!g) return false;
      if (el.scrollLeft < g * 0.25) el.scrollLeft += g;
      else if (el.scrollLeft > g * 1.75) el.scrollLeft -= g;
      else return false;
      return true;
    };

    el.scrollLeft = groupe();

    let survol = false;
    let doigt = false;
    let attente = false;
    let reprise: ReturnType<typeof setTimeout> | undefined;
    const plusTard = () => {
      attente = true;
      clearTimeout(reprise);
      reprise = setTimeout(() => {
        attente = false;
      }, REPRISE);
    };

    // La position se tient à part : le navigateur arrondit `scrollLeft` au
    // pixel, et une poussée d'un demi-pixel par image n'avancerait jamais.
    let position = el.scrollLeft;
    let precedent = 0;
    let image = 0;
    const pas = (t: number) => {
      image = requestAnimationFrame(pas);
      const dt = precedent ? Math.min(64, t - precedent) : 0;
      precedent = t;
      if (survol || doigt || attente) {
        if (recadrer()) position = el.scrollLeft;
        else position = el.scrollLeft;
        return;
      }
      position += ((sens === "gauche" ? 1 : -1) * VITESSE * dt) / 1000;
      el.scrollLeft = position;
      if (recadrer()) position = el.scrollLeft;
    };

    const souris = (e: PointerEvent) => e.pointerType === "mouse";
    const entree = (e: PointerEvent) => {
      if (souris(e)) survol = true;
    };
    const sortie = (e: PointerEvent) => {
      if (souris(e)) survol = false;
    };
    const toucher = () => {
      doigt = true;
    };
    const lacher = () => {
      doigt = false;
      plusTard();
    };
    // Le pavé tactile ou la molette : un geste aussi.
    const molette = () => plusTard();
    // Pendant l'élan qui suit un geste, la piste défile encore : on attend
    // qu'elle s'arrête avant de la pousser à nouveau.
    const defilement = () => {
      if (attente) plusTard();
    };

    // À la souris, on saisit la rangée et on la tire. Sans ceci, tirer sur
    // une photo emporterait l'image (le glisser-déposer du navigateur) et
    // lâcherait la rangée après quelques pixels.
    const pasDeGlisserDeposer = (e: Event) => e.preventDefault();
    let saisie: { x: number; depart: number } | null = null;
    const presser = (e: PointerEvent) => {
      if (!souris(e) || e.button !== 0) return;
      saisie = { x: e.clientX, depart: el.scrollLeft };
      el.setPointerCapture(e.pointerId);
      el.classList.add("defile-saisie");
    };
    const tirer = (e: PointerEvent) => {
      if (!saisie) return;
      el.scrollLeft = saisie.depart - (e.clientX - saisie.x);
      if (recadrer()) saisie = { x: e.clientX, depart: el.scrollLeft };
    };
    const relacher = (e: PointerEvent) => {
      if (!saisie) return;
      saisie = null;
      el.releasePointerCapture(e.pointerId);
      el.classList.remove("defile-saisie");
      plusTard();
    };

    el.addEventListener("pointerenter", entree);
    el.addEventListener("pointerleave", sortie);
    el.addEventListener("touchstart", toucher, { passive: true });
    el.addEventListener("touchend", lacher);
    el.addEventListener("touchcancel", lacher);
    el.addEventListener("wheel", molette, { passive: true });
    el.addEventListener("scroll", defilement, { passive: true });
    el.addEventListener("dragstart", pasDeGlisserDeposer);
    el.addEventListener("pointerdown", presser);
    el.addEventListener("pointermove", tirer);
    el.addEventListener("pointerup", relacher);
    el.addEventListener("pointercancel", relacher);

    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!reduit.matches) image = requestAnimationFrame(pas);

    return () => {
      cancelAnimationFrame(image);
      clearTimeout(reprise);
      el.removeEventListener("pointerenter", entree);
      el.removeEventListener("pointerleave", sortie);
      el.removeEventListener("touchstart", toucher);
      el.removeEventListener("touchend", lacher);
      el.removeEventListener("touchcancel", lacher);
      el.removeEventListener("wheel", molette);
      el.removeEventListener("scroll", defilement);
      el.removeEventListener("dragstart", pasDeGlisserDeposer);
      el.removeEventListener("pointerdown", presser);
      el.removeEventListener("pointermove", tirer);
      el.removeEventListener("pointerup", relacher);
      el.removeEventListener("pointercancel", relacher);
    };
  }, [sens]);

  const groupe = (copie: boolean) => (
    <ul
      aria-hidden={copie || undefined}
      className="m-0 p-0 list-none flex gap-[var(--ecart)] pr-[var(--ecart)]"
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
        ref={cadre}
        className="defile @container overflow-x-auto py-3 -my-3"
        style={{ "--ecart": `${ecart}px` } as CSSProperties}
      >
        <div className="flex w-max">
          {groupe(false)}
          {groupe(true)}
          {groupe(true)}
        </div>
      </div>
    </div>
  );
}

/** Le survol d'une carte qui défile : elle grandit d'un vingt-cinquième. */
export const SURVOL_CARTE =
  "transition-[scale] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:scale-[1.04] motion-reduce:transition-none";
