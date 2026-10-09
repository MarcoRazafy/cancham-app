"use client";

import {
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

export function CarrouselCartes({
  children,
  libelle,
  debord = "-mx-1 px-1",
  surFondClair = false,
}: {
  children: ReactNode;
  libelle: string;
  surFondClair?: boolean;
  debord?: string;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  const piste = useRef<HTMLDivElement>(null);
  const [peutReculer, setPeutReculer] = useState(false);
  const [peutAvancer, setPeutAvancer] = useState(false);
  const sens = useRef(1);
  const [auto, setAuto] = useState(true);
  const [survol, setSurvol] = useState(false);
  const [doigt, setDoigt] = useState(false);
  const [enVue, setEnVue] = useState(false);
  const moinsDeMouvement = useMoinsDeMouvement();

  const mesurer = useCallback(() => {
    const el = piste.current;
    if (!el) return;
    const marge = 8;
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

  const pas = useCallback((el: HTMLDivElement) => {
    const carte = el.firstElementChild as HTMLElement | null;
    return carte ? carte.offsetWidth + 20 : el.clientWidth * 0.8;
  }, []);

  useEffect(() => {
    if (!auto || survol || doigt || !enVue || moinsDeMouvement) return;
    const minuteur = setInterval(() => {
      const el = piste.current;
      if (!el || el.clientWidth === 0) return;
      if (document.querySelector("dialog[open]")) return;
      const marge = 8;
      const auBout = el.scrollLeft + el.clientWidth >= el.scrollWidth - marge;
      const auDebut = el.scrollLeft <= marge;
      if (auBout) sens.current = -1;
      else if (auDebut) sens.current = 1;
      el.scrollBy({ left: sens.current * pas(el), behavior: "smooth" });
    }, ARRET_MS);
    return () => clearInterval(minuteur);
  }, [auto, survol, doigt, enVue, moinsDeMouvement, pas]);

  const poser = () => {
    setDoigt(true);
    const relacher = () => setDoigt(false);
    window.addEventListener("pointerup", relacher, { once: true });
    window.addEventListener("pointercancel", relacher, { once: true });
  };

  const glisser = (direction: 1 | -1) => {
    setAuto(false);
    const el = piste.current;
    if (!el) return;
    el.scrollBy({ left: direction * pas(el), behavior: "smooth" });
  };

  const flecheClasses = `w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer transition-colors disabled:opacity-35 disabled:cursor-default ${
    surFondClair
      ? "border-[#e3e8ee] bg-white text-[var(--marque-nuit)] hover:bg-[#f3f5f8] hover:border-[#c9d2dc]"
      : "border-line bg-surface text-ink hover:bg-surface-2 hover:border-faint"
  }`;

  return (
    <div
      ref={cadre}
      role="region"
      aria-roledescription="carrousel"
      aria-label={libelle}
      className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && setSurvol(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setSurvol(false)}
      onFocus={() => setSurvol(true)}
      onBlur={() => setSurvol(false)}
    >
      <div
        ref={piste}
        onPointerDown={poser}
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
            aria-label="Cartes précédentes"
            className={flecheClasses}
          >
            <ChevronLeft size={19} />
          </button>
          <button
            type="button"
            onClick={() => glisser(1)}
            disabled={!peutAvancer}
            aria-label="Cartes suivantes"
            className={flecheClasses}
          >
            <ChevronRight size={19} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
