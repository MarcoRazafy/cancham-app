"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from "lucide-react";
import { ActionsRappel, NouveauRappel } from "@/components/agenda/Rappels";
import { TEINTES } from "@/components/agenda/ElementAgenda";
import {
  ajouterMois,
  debutMois,
  ecartJours,
  fmtJour,
  grilleMois,
  jourRelatif,
  parJour,
  periodeVue,
  plageHoraire,
  type ElementAgenda,
  type EspaceAgenda,
} from "@/lib/agenda";

/**
 * Bulle d'agenda flottante, à la manière des bulles de discussion de
 * Messenger.
 *
 * Elle se glisse n'importe où à l'écran, se range contre le bord le plus
 * proche quand on la lâche, et retient sa place d'une page et d'une visite à
 * l'autre. Un clic ouvre l'agenda en petit : le mois, le jour choisi, ce qui
 * vient ensuite, et les rappels à ajouter ou cocher sans quitter la page.
 */

const TAILLE = 56;
const MARGE = 16;
/** Sous la barre supérieure : la bulle ne doit pas masquer la recherche. */
const HAUT_MIN = 80;
/** En deçà, un déplacement est un clic un peu appuyé. */
const SEUIL_GLISSE = 6;

/* ============================ Position retenue ============================ */

interface Position {
  cote: "gauche" | "droite";
  /** Hauteur relative, de 0 (en haut) à 1 (en bas) : survit au redimensionnement. */
  haut: number;
}

const DEFAUT: Position = { cote: "droite", haut: 0.82 };
const CLE = "cancham:bulle-agenda";

const abonnes = new Set<() => void>();

function sAbonner(rappel: () => void) {
  abonnes.add(rappel);
  window.addEventListener("storage", rappel);
  window.addEventListener("resize", rappel);
  return () => {
    abonnes.delete(rappel);
    window.removeEventListener("storage", rappel);
    window.removeEventListener("resize", rappel);
  };
}

function lirePosition(): string {
  try {
    return localStorage.getItem(CLE) ?? "";
  } catch {
    return "";
  }
}

const lireFenetre = () => `${window.innerWidth}x${window.innerHeight}`;

function enregistrerPosition(p: Position) {
  try {
    localStorage.setItem(CLE, JSON.stringify(p));
  } catch {
    /* Stockage indisponible : la bulle revient à sa place par défaut. */
  }
  abonnes.forEach((rappel) => rappel());
}

function versPosition(brut: string): Position {
  try {
    const p = JSON.parse(brut);
    if ((p.cote === "gauche" || p.cote === "droite") && Number.isFinite(p.haut))
      return { cote: p.cote, haut: borne(p.haut, 0, 1) };
  } catch {
    /* Valeur absente ou abîmée. */
  }
  return DEFAUT;
}

const borne = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/* ============================ État du panneau ============================ */

/*
 * L'état du panneau vit hors du composant. Un rappel enregistré depuis la
 * bulle passe par une action serveur qui redirige, et cette redirection
 * remonte la coquille : un état React local refermerait le panneau au moment
 * précis où il doit montrer le rappel ajouté.
 */
interface EtatPanneau {
  ouvert: boolean;
  /** Premier jour du mois affiché ; `null` = celui d'aujourd'hui. */
  mois: string | null;
  /** Jour détaillé ; `null` = aujourd'hui. */
  jour: string | null;
  /** Éléments du jour non faits, pour la pastille. */
  compte: number;
}

const ETAT_INITIAL: EtatPanneau = {
  ouvert: false,
  mois: null,
  jour: null,
  compte: 0,
};
let etatPanneau = ETAT_INITIAL;
const abonnesPanneau = new Set<() => void>();

function sAbonnerPanneau(rappel: () => void) {
  abonnesPanneau.add(rappel);
  return () => {
    abonnesPanneau.delete(rappel);
  };
}

function modifierPanneau(maj: Partial<EtatPanneau>) {
  etatPanneau = { ...etatPanneau, ...maj };
  abonnesPanneau.forEach((rappel) => rappel());
}

/* ============================ Bulle ============================ */

export function BulleAgenda({
  espace,
  aujourdhui,
}: {
  espace: EspaceAgenda;
  /** Date du jour selon le serveur — `CANCHAM_TODAY` compris. */
  aujourdhui: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();

  const brut = useSyncExternalStore(sAbonner, lirePosition, () => "");
  const fenetre = useSyncExternalStore(sAbonner, lireFenetre, () => "");
  const position = useMemo(() => versPosition(brut), [brut]);

  const panneauEtat = useSyncExternalStore(
    sAbonnerPanneau,
    () => etatPanneau,
    () => ETAT_INITIAL,
  );
  const { ouvert, compte } = panneauEtat;
  const setOuvert = (o: boolean) => modifierPanneau({ ouvert: o });
  const [glisse, setGlisse] = useState<{ x: number; y: number } | null>(null);
  const depart = useRef<{ px: number; py: number; x: number; y: number }>(null);
  const aGlisse = useRef(false);
  const bulle = useRef<HTMLButtonElement>(null);
  const panneau = useRef<HTMLDivElement>(null);

  /* ---------- Données ---------- */

  const mois = panneauEtat.mois ?? debutMois(aujourdhui);
  const jourChoisi = panneauEtat.jour ?? aujourdhui;
  const setMois = (m: string) => modifierPanneau({ mois: m });
  const setJourChoisi = (j: string) => modifierPanneau({ jour: j });
  const [version, setVersion] = useState(0);
  const [donnees, setDonnees] = useState<{
    cle: string;
    elements: ElementAgenda[];
  } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const { du, au } = periodeVue("mois", mois);
  // Une navigation recharge aussi : une inscription ou un règlement ailleurs
  // dans l'application change ce que la bulle doit montrer.
  const cle = `${du}|${au}|${version}|${pathname}`;
  const recharger = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let annule = false;
    fetch(`/api/agenda?espace=${espace}&du=${du}&au=${au}`, {
      cache: "no-store",
    })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<{ elements: ElementAgenda[] }>;
      })
      .then(({ elements }) => {
        if (annule) return;
        setDonnees({ cle, elements });
        setErreur(null);
        if (du <= aujourdhui && aujourdhui <= au) {
          modifierPanneau({
            compte: elements.filter((e) => e.jour === aujourdhui && !e.fait)
              .length,
          });
        }
      })
      .catch(() => {
        if (!annule) setErreur(cle);
      });
    return () => {
      annule = true;
    };
  }, [espace, du, au, cle, aujourdhui]);

  /* ---------- Fermeture : clic à côté, touche Échap ---------- */

  useEffect(() => {
    if (!ouvert) return;
    // Une boîte de dialogue ouverte depuis le panneau (un rappel) garde la main.
    const dialogueOuvert = () => !!document.querySelector("dialog[open]");
    const clic = (e: globalThis.PointerEvent) => {
      const cible = e.target as Node;
      if (
        dialogueOuvert() ||
        panneau.current?.contains(cible) ||
        bulle.current?.contains(cible)
      )
        return;
      setOuvert(false);
    };
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !dialogueOuvert()) setOuvert(false);
    };
    document.addEventListener("pointerdown", clic);
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("pointerdown", clic);
      document.removeEventListener("keydown", touche);
    };
  }, [ouvert]);

  /** La page courante, où revenir après avoir enregistré un rappel. */
  const retour = useMemo(() => {
    const q = new URLSearchParams(params.toString());
    q.delete("msg");
    const s = q.toString();
    return s ? `${pathname}?${s}` : pathname;
  }, [pathname, params]);

  // Côté serveur, la fenêtre est inconnue ; et sur l'agenda complet, la bulle
  // ferait doublon.
  if (!fenetre || pathname.startsWith(`/${espace}/agenda`)) return null;

  /* ---------- Géométrie ---------- */

  const [L, H] = fenetre.split("x").map(Number);
  const yMax = Math.max(HAUT_MIN, H - TAILLE - MARGE);
  const repos = {
    x: position.cote === "droite" ? L - TAILLE - MARGE : MARGE,
    y: HAUT_MIN + position.haut * (yMax - HAUT_MIN),
  };
  const { x, y } = glisse ?? repos;

  const versPoint = (e: PointerEvent) => {
    const d = depart.current!;
    return {
      x: borne(d.x + e.clientX - d.px, 0, L - TAILLE),
      y: borne(d.y + e.clientY - d.py, 0, H - TAILLE),
    };
  };

  const auPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    depart.current = { px: e.clientX, py: e.clientY, x, y };
    aGlisse.current = false;
  };

  const auPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = depart.current;
    if (!d) return;
    if (
      !aGlisse.current &&
      Math.hypot(e.clientX - d.px, e.clientY - d.py) < SEUIL_GLISSE
    )
      return;
    if (!aGlisse.current) {
      aGlisse.current = true;
      setOuvert(false);
    }
    setGlisse(versPoint(e));
  };

  const basculer = () => {
    if (!ouvert) recharger();
    setOuvert(!ouvert);
  };

  /*
   * L'ouverture se décide au relâchement plutôt qu'au clic : avec la capture
   * du pointeur, un toucher sur téléphone ne produit pas toujours de clic.
   * Relâcher sans avoir glissé ouvre ou ferme ; relâcher après un glisser
   * range la bulle.
   */
  const auPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (!depart.current) return;
    const fin = versPoint(e);
    depart.current = null;
    if (!aGlisse.current) {
      if (e.type === "pointerup") basculer();
      return;
    }
    // On la lâche : elle se range contre le bord le plus proche.
    enregistrerPosition({
      cote: fin.x + TAILLE / 2 < L / 2 ? "gauche" : "droite",
      haut: borne((fin.y - HAUT_MIN) / (yMax - HAUT_MIN || 1), 0, 1),
    });
    setGlisse(null);
  };

  /** Seul le clavier (Entrée, Espace) passe par le clic : `detail` vaut 0. */
  const auClic = (e: MouseEvent<HTMLButtonElement>) => {
    if (e.detail === 0) basculer();
  };

  /* ---------- Panneau ---------- */

  const telephone = L < 640;
  // Sur ordinateur, le panneau s'ouvre à côté de la bulle, centré sur elle
  // sans sortir de l'écran : il garde toute sa hauteur où qu'on l'ait rangée.
  const hauteurPanneau = Math.min(640, H - 24);
  const stylePanneau: CSSProperties = telephone
    ? { left: 8, right: 8, bottom: 8, maxHeight: Math.round(H * 0.82) }
    : {
        width: Math.min(380, L - 2 * (MARGE + TAILLE + 12)),
        [position.cote === "droite" ? "right" : "left"]: MARGE + TAILLE + 12,
        top: borne(
          y + TAILLE / 2 - hauteurPanneau / 2,
          12,
          H - hauteurPanneau - 12,
        ),
        maxHeight: hauteurPanneau,
      };

  const elements = donnees?.elements ?? [];
  const chargement = donnees?.cle !== cle && erreur !== cle;
  const jours = parJour(elements);
  const duJour = jours.get(jourChoisi) ?? [];
  const ensuite =
    jourChoisi === aujourdhui
      ? elements.filter((e) => e.jour > aujourdhui && !e.fait).slice(0, 4)
      : [];

  const changerMois = (sens: 1 | -1) => {
    const suivant = ajouterMois(mois, sens);
    setMois(suivant);
    setJourChoisi(suivant === debutMois(aujourdhui) ? aujourdhui : suivant);
  };
  const fermer = () => setOuvert(false);

  return (
    <>
      <button
        ref={bulle}
        type="button"
        aria-label={`Agenda${compte ? ` — ${compte} élément${compte > 1 ? "s" : ""} aujourd’hui` : ""}`}
        aria-expanded={ouvert}
        title="Agenda · glissez la bulle pour la déplacer"
        onPointerDown={auPointerDown}
        onPointerMove={auPointerMove}
        onPointerUp={auPointerUp}
        onPointerCancel={auPointerUp}
        onClick={auClic}
        className={`print:hidden fixed z-[60] rounded-full flex items-center justify-center text-white border-2 border-white/90 select-none touch-none shadow-[0_10px_28px_-6px_rgba(15,29,44,0.6)] ${
          glisse
            ? "cursor-grabbing scale-110"
            : "cursor-pointer transition-[left,top,transform] duration-200 hover:scale-105"
        }`}
        style={{
          left: x,
          top: y,
          width: TAILLE,
          height: TAILLE,
          background: "var(--laterale)",
        }}
      >
        <CalendarRange size={24} aria-hidden />
        {compte ? (
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center border-2 border-white tabular-nums">
            {compte}
          </span>
        ) : null}
      </button>

      {ouvert ? (
        <div
          ref={panneau}
          role="dialog"
          aria-label="Agenda"
          className={`print:hidden fixed z-[61] flex flex-col bg-surface text-ink border border-line rounded-[var(--radius-l)] shadow-[0_22px_60px_-14px_rgba(15,29,44,0.5)] overflow-hidden ${
            telephone ? "" : "min-h-[320px]"
          }`}
          style={stylePanneau}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 text-white shrink-0"
            style={{ background: "var(--superieure)" }}
          >
            <CalendarRange size={19} aria-hidden className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold leading-tight">
                Agenda
              </div>
              <div className="text-[12px] text-white/65 truncate">
                {fmtJour(aujourdhui, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
            <Link
              href={`/${espace}/agenda`}
              onClick={fermer}
              aria-label="Ouvrir l’agenda complet"
              title="Agenda complet"
              className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            >
              <Maximize2 size={15} />
            </Link>
            <button
              type="button"
              onClick={fermer}
              aria-label="Fermer l’agenda"
              className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer border-0"
            >
              <X size={16} />
            </button>
          </div>

          <div className="overflow-y-auto">
            {/* ---------- Mois ---------- */}
            <div className="px-3 pt-2.5 pb-2 border-b border-line">
              <div className="flex items-center justify-between mb-1">
                <button
                  type="button"
                  onClick={() => changerMois(-1)}
                  aria-label="Mois précédent"
                  className="w-8 h-8 rounded-md text-muted hover:text-ink hover:bg-surface-2 flex items-center justify-center cursor-pointer bg-transparent border-0"
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMois(debutMois(aujourdhui));
                    setJourChoisi(aujourdhui);
                  }}
                  title="Revenir à aujourd’hui"
                  className="text-[14px] font-semibold text-ink bg-transparent border-0 cursor-pointer px-2 py-1 rounded-md hover:bg-surface-2 first-letter:uppercase"
                >
                  {fmtJour(mois, { month: "long", year: "numeric" })}
                </button>
                <button
                  type="button"
                  onClick={() => changerMois(1)}
                  aria-label="Mois suivant"
                  className="w-8 h-8 rounded-md text-muted hover:text-ink hover:bg-surface-2 flex items-center justify-center cursor-pointer bg-transparent border-0"
                >
                  <ChevronRight size={17} />
                </button>
              </div>

              <div className="grid grid-cols-7 text-center text-[10.5px] font-bold uppercase text-faint pb-1">
                {["L", "M", "M", "J", "V", "S", "D"].map((j, i) => (
                  <span key={i}>{j}</span>
                ))}
              </div>

              <div
                className={`transition-opacity ${chargement ? "opacity-60" : ""}`}
              >
                {grilleMois(mois).map((semaine) => (
                  <div key={semaine[0]} className="grid grid-cols-7">
                    {semaine.map((jour) => {
                      const items = jours.get(jour) ?? [];
                      const choisi = jour === jourChoisi;
                      const estAujourdhui = jour === aujourdhui;
                      return (
                        <button
                          key={jour}
                          type="button"
                          onClick={() => setJourChoisi(jour)}
                          aria-pressed={choisi}
                          aria-label={`${fmtJour(jour, { weekday: "long", day: "numeric", month: "long" })}${
                            items.length
                              ? ` — ${items.length} élément${items.length > 1 ? "s" : ""}`
                              : ""
                          }`}
                          className={`h-10 flex flex-col items-center justify-center gap-[3px] rounded-md border-0 cursor-pointer ${
                            choisi
                              ? "bg-accent-soft"
                              : "bg-transparent hover:bg-surface-2"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[12.5px] font-semibold tabular-nums ${
                              estAujourdhui
                                ? "bg-accent text-white"
                                : jour.slice(0, 7) !== mois.slice(0, 7)
                                  ? "text-faint"
                                  : choisi
                                    ? "text-accent"
                                    : "text-ink"
                            }`}
                          >
                            {Number(jour.slice(8))}
                          </span>
                          <span className="flex gap-[2px] h-1">
                            {items.slice(0, 3).map((e) => (
                              <span
                                key={e.id}
                                className={`w-1 h-1 rounded-full ${
                                  e.urgent ? "bg-bad" : TEINTES[e.type].point
                                } ${e.fait ? "opacity-40" : ""}`}
                              />
                            ))}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* ---------- Jour choisi ---------- */}
            <div className="px-4 pt-3 pb-4">
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <h3 className="m-0 text-[14px] font-semibold">
                  {jourRelatif(jourChoisi, aujourdhui)}
                </h3>
                <NouveauRappel
                  jour={jourChoisi}
                  retour={retour}
                  libelle="Rappel"
                  discret
                  apresEnvoi={recharger}
                />
              </div>

              {erreur === cle ? (
                <p className="m-0 text-[13px] text-bad py-2">
                  L’agenda ne répond pas pour le moment.
                </p>
              ) : chargement && !donnees ? (
                <p className="m-0 text-[13px] text-faint py-2">Chargement…</p>
              ) : duJour.length ? (
                <ul className="m-0 p-0 list-none">
                  {duJour.map((e) => (
                    <LigneBulle
                      key={e.id}
                      element={e}
                      retour={retour}
                      fermer={fermer}
                      recharger={recharger}
                    />
                  ))}
                </ul>
              ) : (
                <p className="m-0 text-[13px] text-faint py-2">
                  Rien de prévu ce jour-là.
                </p>
              )}

              {ensuite.length ? (
                <>
                  <h4 className="m-0 mt-3 mb-1 text-[11px] font-bold uppercase tracking-[0.06em] text-faint">
                    Ensuite
                  </h4>
                  <ul className="m-0 p-0 list-none">
                    {ensuite.map((e) => (
                      <LigneBulle
                        key={e.id}
                        element={e}
                        retour={retour}
                        fermer={fermer}
                        recharger={recharger}
                        aujourdhui={aujourdhui}
                      />
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          </div>

          <Link
            href={`/${espace}/agenda`}
            onClick={fermer}
            className="shrink-0 block text-center px-4 py-2.5 border-t border-line text-[13px] font-semibold text-accent no-underline hover:bg-surface-2"
          >
            Voir l’agenda complet
          </Link>
        </div>
      ) : null}
    </>
  );
}

/** Un élément du panneau. Avec `aujourdhui`, le jour est rappelé devant l'heure. */
function LigneBulle({
  element: e,
  retour,
  fermer,
  recharger,
  aujourdhui,
}: {
  element: ElementAgenda;
  retour: string;
  fermer: () => void;
  recharger: () => void;
  aujourdhui?: string;
}) {
  const quand = [
    aujourdhui
      ? ecartJours(aujourdhui, e.jour) <= 1
        ? jourRelatif(e.jour, aujourdhui)
        : fmtJour(e.jour, { weekday: "short", day: "numeric", month: "short" })
      : null,
    plageHoraire(e.debut, e.fin) ?? (aujourdhui ? null : "Journée"),
  ]
    .filter(Boolean)
    .join(" · ");

  const contenu = (
    <>
      <span
        aria-hidden
        className={`mt-[6px] w-2 h-2 rounded-full shrink-0 ${
          e.urgent ? "bg-bad" : TEINTES[e.type].point
        }`}
      />
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[13.5px] font-semibold leading-snug ${
            e.fait
              ? "line-through text-muted"
              : e.urgent
                ? "text-bad"
                : "text-ink"
          }`}
        >
          {e.titre}
        </span>
        <span className="block text-[12px] text-muted truncate">
          {[quand, e.lieu, e.detail].filter(Boolean).join(" · ")}
        </span>
      </span>
    </>
  );

  return (
    <li className="border-b border-line last:border-b-0">
      {e.href ? (
        <Link
          href={e.href}
          onClick={fermer}
          className="flex items-start gap-2.5 py-2 px-2 -mx-2 rounded-md no-underline hover:bg-surface-2"
        >
          {contenu}
        </Link>
      ) : (
        <div className="flex items-start gap-2.5 py-2">
          {contenu}
          <ActionsRappel element={e} retour={retour} apresEnvoi={recharger} />
        </div>
      )}
    </li>
  );
}
