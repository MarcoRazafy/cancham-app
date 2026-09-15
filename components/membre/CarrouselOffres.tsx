"use client";

import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Millisecondes entre deux avances automatiques. */
const CADENCE = 5000;

/**
 * Carrousel des offres du tableau de bord.
 *
 * Trois cartes à l'écran, puis les trois suivantes : on avance par pages
 * entières, pas carte par carte, pour que l'œil retrouve toujours une grille
 * alignée plutôt qu'une carte coupée en deux.
 *
 * Le défilement reste natif — accrochage CSS, molette et doigt fonctionnent
 * sans JavaScript. L'avance automatique, les flèches et les pastilles ne sont
 * que des commodités posées par-dessus.
 *
 * Elle s'interrompt au survol, au focus clavier et quand l'onglet passe en
 * arrière-plan : personne ne perd la carte qu'il était en train de lire. Et
 * elle ne démarre pas du tout si le système demande moins d'animations.
 */
export function CarrouselOffres({ children }: { children: ReactNode }) {
  const piste = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);
  const [enPause, setEnPause] = useState(false);

  /** Nombre de pages et page courante, relus depuis la position réelle. */
  const mesurer = useCallback(() => {
    const el = piste.current;
    if (!el) return;
    const largeur = el.clientWidth;
    if (largeur === 0) return;
    setPages(Math.max(1, Math.round(el.scrollWidth / largeur)));
    setPage(Math.round(el.scrollLeft / largeur));
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

  const allerA = useCallback((cible: number) => {
    const el = piste.current;
    if (!el) return;
    el.scrollTo({ left: cible * el.clientWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (enPause || pages < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const minuteur = window.setInterval(() => {
      if (document.hidden) return;
      const el = piste.current;
      if (!el) return;
      const suivante = (Math.round(el.scrollLeft / el.clientWidth) + 1) % pages;
      el.scrollTo({ left: suivante * el.clientWidth, behavior: "smooth" });
    }, CADENCE);

    return () => window.clearInterval(minuteur);
  }, [enPause, pages]);

  const flecheClasses =
    "w-9 h-9 rounded-[10px] border border-line bg-surface text-muted flex items-center justify-center cursor-pointer transition-colors hover:bg-accent hover:text-white hover:border-accent disabled:opacity-30 disabled:cursor-default disabled:hover:bg-surface disabled:hover:text-muted disabled:hover:border-line";

  return (
    <div
      className="relative"
      onMouseEnter={() => setEnPause(true)}
      onMouseLeave={() => setEnPause(false)}
      onFocusCapture={() => setEnPause(true)}
      onBlurCapture={() => setEnPause(false)}
    >
      <div
        ref={piste}
        className="flex items-stretch gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/*
          Chaque carte occupe un tiers de la piste : trois par écran, et la page
          suivante s'accroche pile au bord. L'enveloppe est indispensable — une
          carte qui porte elle-même `h-full` fixe sa hauteur et perd du même
          coup l'étirement du conteneur, d'où des cartes de hauteurs inégales.
        */}
        {Children.map(children, (carte) => (
          <div className="snap-start shrink-0 flex basis-full sm:basis-[calc((100%-1rem)/2)] md:basis-[calc((100%-2rem)/3)]">
            {carte}
          </div>
        ))}
      </div>

      {pages > 1 ? (
        <div className="flex items-center justify-between gap-3 mt-4">
          <div className="flex gap-1.5">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => allerA(i)}
                aria-label={`Offres ${i + 1} sur ${pages}`}
                aria-current={i === page}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === page ? "w-6 bg-accent" : "w-2 bg-line hover:bg-faint"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => allerA(Math.max(0, page - 1))}
              disabled={page === 0}
              aria-label="Offres précédentes"
              className={flecheClasses}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() => allerA(Math.min(pages - 1, page + 1))}
              disabled={page >= pages - 1}
              aria-label="Offres suivantes"
              className={flecheClasses}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
