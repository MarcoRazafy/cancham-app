"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Carrousel horizontal des prochains rendez-vous.
 *
 * Le défilement est natif, avec accrochage : il fonctionne au doigt, à la
 * molette et au clavier sans une ligne de JavaScript. Les flèches ne sont
 * qu'une commodité en plus, et disparaissent quand tout tient à l'écran.
 */
export function CarrouselEvenements({
  children,
  debord = "-mx-1 px-1",
}: {
  children: ReactNode;
  /**
   * Marges négatives et marge intérieure égales au retrait du cadre qui porte
   * le carrousel : la piste court jusqu'à son bord, et une carte à demi
   * visible s'y coupe net plutôt qu'au milieu de la marge.
   */
  debord?: string;
}) {
  const piste = useRef<HTMLDivElement>(null);
  const [peutReculer, setPeutReculer] = useState(false);
  const [peutAvancer, setPeutAvancer] = useState(false);

  const mesurer = useCallback(() => {
    const el = piste.current;
    if (!el) return;
    const marge = 8; // tolérance de sous-pixel sur les bords
    setPeutReculer(el.scrollLeft > marge);
    setPeutAvancer(el.scrollLeft + el.clientWidth < el.scrollWidth - marge);
  }, []);

  useEffect(() => {
    const el = piste.current;
    if (!el) return;

    mesurer();
    el.addEventListener("scroll", mesurer, { passive: true });

    const observateur = new ResizeObserver(mesurer);
    observateur.observe(el);

    return () => {
      el.removeEventListener("scroll", mesurer);
      observateur.disconnect();
    };
  }, [mesurer]);

  const glisser = (sens: 1 | -1) => {
    const el = piste.current;
    if (!el) return;
    // On avance d'une carte : la largeur du premier enfant, gouttière comprise.
    const carte = el.firstElementChild as HTMLElement | null;
    const pas = carte ? carte.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: sens * pas, behavior: "smooth" });
  };

  const flecheClasses =
    "w-10 h-10 rounded-full border border-white/20 bg-white/[0.06] text-white flex items-center justify-center cursor-pointer transition-colors hover:bg-white/15 disabled:opacity-25 disabled:cursor-default";

  return (
    <div className="relative">
      <div
        ref={piste}
        className={`flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${debord}`}
      >
        {children}
      </div>

      {peutReculer || peutAvancer ? (
        <div className="flex justify-end gap-2.5 mt-5">
          <button
            type="button"
            onClick={() => glisser(-1)}
            disabled={!peutReculer}
            aria-label="Rendez-vous précédents"
            className={flecheClasses}
          >
            <ChevronLeft size={19} />
          </button>
          <button
            type="button"
            onClick={() => glisser(1)}
            disabled={!peutAvancer}
            aria-label="Rendez-vous suivants"
            className={flecheClasses}
          >
            <ChevronRight size={19} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
