"use client";

import {
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { unstable_rethrow } from "next/navigation";
import { Check, Move, X } from "lucide-react";
import { repositionnerCouverture } from "@/lib/actions/members";
import {
  CADRAGE_CENTRE,
  DEBORD_MINIMAL,
  PAS_CLAVIER,
  cadrageApresGlissement,
  debordement,
  positionObjet,
  pourcentageDeCadrage,
  type Cadrage,
} from "@/lib/cadrage";

/**
 * La couverture d'une fiche, que l'on peut repositionner.
 *
 * Au repos, elle s'affiche comme partout ailleurs (`children`), avec un
 * bouton « Repositionner ». Le bouton ouvre le réglage : on fait glisser la
 * photo dans son cadre — à la souris, au doigt ou aux flèches du clavier —,
 * puis on enregistre. Le cadre du réglage est celui de la fiche de
 * l'annuaire : ce qu'on y voit est ce que verront les autres membres.
 *
 * Seul le point visible est enregistré : la photo, elle, n'est pas retaillée,
 * et s'agrandit toujours en entier.
 */
export function CouvertureReglable({
  memberId,
  src,
  cadrage = CADRAGE_CENTRE,
  retour,
  className,
  children,
}: {
  memberId: string;
  /** Sans photo, il n'y a rien à repositionner : le bouton ne paraît pas. */
  src?: string | null;
  cadrage?: Cadrage;
  /** La page d'où l'on règle : elle dit qui agit, le membre ou l'équipe. */
  retour: string;
  /** Les dimensions du cadre — les mêmes que celles de l'affichage au repos. */
  className: string;
  children: ReactNode;
}) {
  const [reglage, setReglage] = useState(false);
  const [c, setC] = useState<Cadrage>(cadrage);
  const [saisie, setSaisie] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, lancer] = useTransition();

  const cadre = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  /** Le geste en cours : d'où il part, et quel doigt le mène. */
  const geste = useRef<{
    id: number;
    x: number;
    y: number;
    depart: Cadrage;
  } | null>(null);

  if (!src) return <>{children}</>;

  const ouvrir = () => {
    setC(cadrage);
    setErreur(null);
    setReglage(true);
  };
  const annuler = () => {
    geste.current = null;
    setSaisie(false);
    setReglage(false);
  };
  const enregistrer = () => {
    setErreur(null);
    lancer(async () => {
      let r: Awaited<ReturnType<typeof repositionnerCouverture>>;
      try {
        r = await repositionnerCouverture({
          memberId,
          x: pourcentageDeCadrage(c.x),
          y: pourcentageDeCadrage(c.y),
          retour,
        });
      } catch (e) {
        // Une redirection de Next — session expirée, accès refusé — suit son
        // cours ; le reste est une panne de réseau, et le réglage reste là.
        unstable_rethrow(e);
        setErreur(
          "Le cadrage n’a pas été enregistré. Vérifiez votre connexion, puis réessayez.",
        );
        return;
      }
      if ("erreur" in r) setErreur(r.erreur);
      // Dans la transition : le réglage se referme avec la page revalidée,
      // d'un seul tenant, sans repasser par l'ancien cadrage.
      else lancer(() => setReglage(false));
    });
  };

  const tailles = () => {
    const r = cadre.current?.getBoundingClientRect();
    const i = photo.current;
    return {
      cadre: { largeur: r?.width ?? 0, hauteur: r?.height ?? 0 },
      photo: { largeur: i?.naturalWidth ?? 0, hauteur: i?.naturalHeight ?? 0 },
    };
  };

  const debut = (e: PointerEvent<HTMLDivElement>) => {
    // À la souris, seul le bouton principal fait glisser.
    if (envoi || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    geste.current = { id: e.pointerId, x: e.clientX, y: e.clientY, depart: c };
    setSaisie(true);
  };
  const glisser = (e: PointerEvent<HTMLDivElement>) => {
    const g = geste.current;
    if (!g || g.id !== e.pointerId) return;
    const t = tailles();
    setC(
      cadrageApresGlissement(
        g.depart,
        e.clientX - g.x,
        e.clientY - g.y,
        t.cadre,
        t.photo,
      ),
    );
  };
  const fin = (e: PointerEvent<HTMLDivElement>) => {
    if (geste.current?.id !== e.pointerId) return;
    geste.current = null;
    setSaisie(false);
  };

  // Les flèches déplacent le regard, pas la photo : « haut » montre le haut.
  const auClavier = (e: KeyboardEvent<HTMLDivElement>) => {
    if (envoi) return;
    const pas: Record<string, [number, number]> = {
      ArrowUp: [0, -PAS_CLAVIER],
      ArrowDown: [0, PAS_CLAVIER],
      ArrowLeft: [-PAS_CLAVIER, 0],
      ArrowRight: [PAS_CLAVIER, 0],
    };
    if (e.key === "Escape") {
      e.preventDefault();
      annuler();
      return;
    }
    const d = pas[e.key];
    if (!d) return;
    e.preventDefault();
    const borne = (v: number) => Math.min(100, Math.max(0, v));
    // Comme au glissement : rien ne bouge dans le sens où la photo ne
    // dépasse pas — on enregistrerait un décalage qu'on n'a pas vu.
    const t = tailles();
    const deb = debordement(t.cadre, t.photo);
    setC((v) => ({
      x: deb.largeur >= DEBORD_MINIMAL ? borne(v.x + d[0]) : v.x,
      y: deb.hauteur >= DEBORD_MINIMAL ? borne(v.y + d[1]) : v.y,
    }));
  };

  if (!reglage) {
    return (
      <div className="relative">
        {children}
        <button
          type="button"
          onClick={ouvrir}
          className="absolute right-3 top-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-[#0f1d2c]/70 px-3 py-1.5 text-[12.5px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-[#0f1d2c]/90 print:hidden"
        >
          <Move size={14} aria-hidden /> Repositionner
        </button>
      </div>
    );
  }

  return (
    <div>
      <div ref={cadre} className={`relative overflow-hidden ${className}`}>
        {/* Une image ordinaire : il faut ses dimensions réelles pour savoir
            de combien elle dépasse, et elle suit le doigt sans attendre. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={photo}
          src={src}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-cover"
          style={{ objectPosition: positionObjet(c) }}
        />
        <div
          role="group"
          tabIndex={0}
          aria-label="Photo de couverture : faites-la glisser, ou utilisez les flèches du clavier, pour choisir la partie visible"
          onPointerDown={debut}
          onPointerMove={glisser}
          onPointerUp={fin}
          onPointerCancel={fin}
          onKeyDown={auClavier}
          // `touch-none` : le doigt déplace la photo, pas la page.
          className={`absolute inset-0 touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${
            saisie ? "cursor-grabbing" : "cursor-grab"
          }`}
        />
        <span
          className={`pointer-events-none absolute left-1/2 top-1/2 inline-flex max-w-[calc(100%-24px)] -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-[#0f1d2c]/70 px-3.5 py-2 text-center text-[12.5px] font-semibold text-white backdrop-blur-sm transition-opacity ${
            saisie ? "opacity-0" : "opacity-100"
          }`}
        >
          <Move size={14} aria-hidden className="shrink-0" /> Faites glisser la
          photo pour la repositionner
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-line bg-surface-2 px-4 py-2.5">
        <span
          role="status"
          className={`mr-auto text-[12.5px] ${erreur ? "font-semibold text-bad" : "text-muted"}`}
        >
          {erreur ??
            "Le cadrage vaut aussi pour la carte de l’annuaire. La photo n’est pas retaillée."}
        </span>
        <button
          type="button"
          onClick={annuler}
          disabled={envoi}
          className="btn-contour btn-contour-sm cursor-pointer text-ink hover:bg-surface-3 disabled:cursor-default disabled:opacity-60"
        >
          <X size={14} /> Annuler
        </button>
        <button
          type="button"
          onClick={enregistrer}
          disabled={envoi}
          className="btn-action btn-action-sm cursor-pointer disabled:cursor-default disabled:opacity-60"
        >
          <Check size={14} /> {envoi ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
