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

/**
 * Carrousel d'une section entière : trois éléments à l'écran, puis les trois
 * suivants.
 *
 * On avance par pages, pas élément par élément, pour que l'œil retrouve
 * toujours une rangée alignée plutôt qu'une carte coupée en deux.
 *
 * Le défilement reste natif — accrochage CSS, molette et doigt fonctionnent
 * sans JavaScript. Flèches et pastilles sont posées par-dessus, et
 * disparaissent quand tout tient sur une page. Pas d'avance automatique : on
 * parcourt un catalogue, on ne subit pas un diaporama.
 */
export function CarrouselSection({
  children,
  libelle,
}: {
  children: ReactNode;
  /** Ce que l'on fait défiler, pour les lecteurs d'écran : « photos des produits ». */
  libelle: string;
}) {
  const piste = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);

  /** Nombre de pages et page courante, relus depuis la position réelle. */
  const mesurer = useCallback(() => {
    const el = piste.current;
    if (!el || el.clientWidth === 0) return;
    setPages(Math.max(1, Math.round(el.scrollWidth / el.clientWidth)));
    setPage(Math.round(el.scrollLeft / el.clientWidth));
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

  const allerA = (cible: number) => {
    const el = piste.current;
    if (!el) return;
    el.scrollTo({ left: cible * el.clientWidth, behavior: "smooth" });
  };

  const fleche =
    "w-9 h-9 rounded-[10px] border border-line bg-surface text-muted flex items-center justify-center cursor-pointer transition-colors hover:bg-accent hover:text-white hover:border-accent disabled:opacity-30 disabled:cursor-default disabled:hover:bg-surface disabled:hover:text-muted disabled:hover:border-line";

  return (
    <div role="region" aria-roledescription="carrousel" aria-label={libelle}>
      <div
        ref={piste}
        className="flex items-stretch gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/*
          Chaque élément occupe un tiers de la piste : trois par page, et la
          page suivante s'accroche pile au bord. L'enveloppe est nécessaire —
          une carte qui porte elle-même `h-full` fixe sa hauteur et perd
          l'étirement du conteneur, d'où des cartes de hauteurs inégales.
        */}
        {Children.map(children, (element) => (
          <div className="snap-start shrink-0 flex basis-full sm:basis-[calc((100%-1rem)/2)] md:basis-[calc((100%-2rem)/3)]">
            {element}
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
                aria-label={`Page ${i + 1} sur ${pages}`}
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
              aria-label="Page précédente"
              className={fleche}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() => allerA(Math.min(pages - 1, page + 1))}
              disabled={page >= pages - 1}
              aria-label="Page suivante"
              className={fleche}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
