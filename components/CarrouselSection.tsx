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

const ARRET_MS = 5000;

function useMoinsDeMouvement(): boolean {
  const [reduit, setReduit] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const suivre = () => setReduit(mq.matches);
    suivre();
    mq.addEventListener("change", suivre);
    return () => mq.removeEventListener("change", suivre);
  }, []);
  return reduit;
}

export function CarrouselSection({
  children,
  libelle,
}: {
  children: ReactNode;
  libelle: string;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  const piste = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);
  const sens = useRef(1);
  const [auto, setAuto] = useState(true);
  const [survol, setSurvol] = useState(false);
  const [doigt, setDoigt] = useState(false);
  const [enVue, setEnVue] = useState(false);
  const moinsDeMouvement = useMoinsDeMouvement();

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

  useEffect(() => {
    const el = cadre.current;
    if (!el) return;
    const observateur = new IntersectionObserver(
      ([entree]) => setEnVue(entree.isIntersecting),
      { threshold: 0.35 },
    );
    observateur.observe(el);
    return () => observateur.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || survol || doigt || !enVue || moinsDeMouvement || pages < 2)
      return;
    const minuteur = setInterval(() => {
      const el = piste.current;
      if (!el || el.clientWidth === 0) return;
      if (document.querySelector("dialog[open]")) return;
      const courante = Math.round(el.scrollLeft / el.clientWidth);
      if (courante >= pages - 1) sens.current = -1;
      else if (courante <= 0) sens.current = 1;
      el.scrollTo({
        left: (courante + sens.current) * el.clientWidth,
        behavior: "smooth",
      });
    }, ARRET_MS);
    return () => clearInterval(minuteur);
  }, [auto, survol, doigt, enVue, moinsDeMouvement, pages]);

  const poser = () => {
    setDoigt(true);
    const relacher = () => setDoigt(false);
    window.addEventListener("pointerup", relacher, { once: true });
    window.addEventListener("pointercancel", relacher, { once: true });
  };

  const allerA = (cible: number) => {
    setAuto(false);
    const el = piste.current;
    if (!el) return;
    el.scrollTo({ left: cible * el.clientWidth, behavior: "smooth" });
  };

  const fleche =
    "w-9 h-9 rounded-[10px] border border-line bg-surface text-muted flex items-center justify-center cursor-pointer transition-colors hover:bg-accent hover:text-white hover:border-accent disabled:opacity-30 disabled:cursor-default disabled:hover:bg-surface disabled:hover:text-muted disabled:hover:border-line";

  return (
    <div
      ref={cadre}
      role="region"
      aria-roledescription="carrousel"
      aria-label={libelle}
      onPointerEnter={(e) => e.pointerType === "mouse" && setSurvol(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setSurvol(false)}
      onFocus={() => setSurvol(true)}
      onBlur={() => setSurvol(false)}
    >
      <div
        ref={piste}
        onPointerDown={poser}
        className="flex items-stretch gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
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
