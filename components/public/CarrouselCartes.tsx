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
 * Carrousel horizontal des cartes de la vitrine — rendez-vous et actualités.
 *
 * Le défilement est natif, avec accrochage : il fonctionne au doigt, à la
 * molette et au clavier sans une ligne de JavaScript. Les flèches ne sont
 * qu'une commodité en plus, et disparaissent quand tout tient à l'écran.
 *
 * Tant qu'on n'y touche pas, la piste avance seule, carte après carte, puis
 * revient sur ses pas : on voit d'un coup d'œil qu'il y en a d'autres plus
 * loin. Elle s'arrête sous la souris, sous le doigt et au focus, et ne repart
 * plus dès qu'on a pris les flèches : on ne se bat pas contre un diaporama.
 */

/** Temps d'arrêt sur chaque carte avant de glisser à la suivante. */
const ARRET_MS = 5000;

/** Le va-et-vient s'abstient quand le système demande moins d'animations. */
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
  /** Ce que l'on fait défiler, pour les lecteurs d'écran. */
  libelle: string;
  /**
   * Le carrousel est posé sur une bande claire. Les jetons de teinte de la
   * vitrine sont taillés pour le bleu nuit : sur du blanc, les flèches y
   * disparaîtraient.
   */
  surFondClair?: boolean;
  /**
   * Marges négatives et marge intérieure égales au retrait du cadre qui porte
   * le carrousel : la piste court jusqu'à son bord, et une carte à demi
   * visible s'y coupe net plutôt qu'au milieu de la marge.
   */
  debord?: string;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  const piste = useRef<HTMLDivElement>(null);
  const [peutReculer, setPeutReculer] = useState(false);
  const [peutAvancer, setPeutAvancer] = useState(false);
  /** Sens du va-et-vient : +1 vers la gauche, −1 au retour. */
  const sens = useRef(1);
  /** Faux dès que quelqu'un prend les commandes : plus d'avance automatique. */
  const [auto, setAuto] = useState(true);
  /** La souris ou le focus est dans le carrousel : on laisse regarder. */
  const [survol, setSurvol] = useState(false);
  /** Un doigt ou un bouton appuyé sur la piste : on ne glisse pas dessous. */
  const [doigt, setDoigt] = useState(false);
  /** Le carrousel est à l'écran : rien ne bouge dans une section jamais vue. */
  const [enVue, setEnVue] = useState(false);
  const moinsDeMouvement = useMoinsDeMouvement();

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

  /** Le pas : la largeur d'une carte, gouttière comprise. */
  const pas = useCallback((el: HTMLDivElement) => {
    const carte = el.firstElementChild as HTMLElement | null;
    return carte ? carte.offsetWidth + 20 : el.clientWidth * 0.8;
  }, []);

  useEffect(() => {
    if (!auto || survol || doigt || !enVue || moinsDeMouvement) return;
    const minuteur = setInterval(() => {
      const el = piste.current;
      if (!el || el.clientWidth === 0) return;
      // Une fiche ouverte par-dessus : rien ne bouge derrière elle.
      if (document.querySelector("dialog[open]")) return;
      const marge = 8;
      const auBout = el.scrollLeft + el.clientWidth >= el.scrollWidth - marge;
      const auDebut = el.scrollLeft <= marge;
      // Arrivé au bout, on repart dans l'autre sens : le retour se voit, là
      // où un saut au début passerait pour un bug d'affichage.
      if (auBout) sens.current = -1;
      else if (auDebut) sens.current = 1;
      el.scrollBy({ left: sens.current * pas(el), behavior: "smooth" });
    }, ARRET_MS);
    return () => clearInterval(minuteur);
  }, [auto, survol, doigt, enVue, moinsDeMouvement, pas]);

  /**
   * Un doigt posé arrête le va-et-vient le temps du geste, pas plus : sur
   * téléphone, on touche la piste rien qu'en faisant défiler la page. Le
   * relâchement est écouté sur la fenêtre, le doigt partant souvent ailleurs.
   */
  const poser = () => {
    setDoigt(true);
    const relacher = () => setDoigt(false);
    window.addEventListener("pointerup", relacher, { once: true });
    window.addEventListener("pointercancel", relacher, { once: true });
  };

  /** Les flèches : le va-et-vient s'efface devant un vrai clic. */
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
      // Le survol n'a de sens qu'à la souris : sur écran tactile, il ne se
      // termine jamais, et le carrousel resterait figé après une simple tape.
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
