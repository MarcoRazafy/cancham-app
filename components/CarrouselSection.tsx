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
 * disparaissent quand tout tient sur une page.
 *
 * Tant qu'on n'y touche pas, la piste fait son va-et-vient : toutes les cinq
 * secondes elle glisse d'une page vers la gauche, puis, arrivée au bout,
 * revient sur ses pas — le catalogue se présente tout seul, et l'on voit du
 * premier coup d'œil qu'il continue plus loin. Elle marque une pause sous la
 * souris, sous le doigt et au focus, et ne repart plus dès qu'on a cliqué une
 * flèche ou une pastille : on ne se bat pas contre un diaporama.
 */

/** Temps d'arrêt sur chaque page avant de glisser à la suivante. */
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

export function CarrouselSection({
  children,
  libelle,
}: {
  children: ReactNode;
  /** Ce que l'on fait défiler, pour les lecteurs d'écran : « photos des produits ». */
  libelle: string;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  const piste = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);
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
      // Une fiche d'offre ouverte par-dessus : rien ne bouge derrière elle.
      if (document.querySelector("dialog[open]")) return;
      const courante = Math.round(el.scrollLeft / el.clientWidth);
      // Arrivé au bout, on repart dans l'autre sens : le retour se voit, là
      // où un saut au début passerait pour un bug d'affichage.
      if (courante >= pages - 1) sens.current = -1;
      else if (courante <= 0) sens.current = 1;
      el.scrollTo({
        left: (courante + sens.current) * el.clientWidth,
        behavior: "smooth",
      });
    }, ARRET_MS);
    return () => clearInterval(minuteur);
  }, [auto, survol, doigt, enVue, moinsDeMouvement, pages]);

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

  /** Flèches et pastilles : le va-et-vient s'efface devant un vrai clic. */
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
