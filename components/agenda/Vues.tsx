import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BlocRappel, NouveauRappel } from "@/components/agenda/Rappels";
import {
  CarteElement,
  PuceAgenda,
  TEINTES,
} from "@/components/agenda/ElementAgenda";
import { Card } from "@/components/ui";
import {
  ajouterJours,
  ecartJours,
  enMinutes,
  fmtJour,
  grilleMois,
  joursSemaine,
  jourRelatif,
  parJour,
  plageHoraire,
  type ElementAgenda,
} from "@/lib/agenda";

/**
 * Les trois vues de l'agenda. Composants serveur : une grille de calendrier
 * n'a besoin d'aucun JavaScript, seuls les rappels en embarquent.
 */

const JOURS_COURTS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/* ============================ Mois ============================ */

export function VueMois({
  date,
  aujourdhui,
  jourChoisi,
  elements,
  lienJour,
  retour,
}: {
  date: string;
  aujourdhui: string;
  jourChoisi: string;
  elements: ElementAgenda[];
  lienJour: (jour: string) => string;
  retour: string;
}) {
  const jours = parJour(elements);
  const mois = date.slice(0, 7);

  return (
    <>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 bg-surface-2 border-b border-line">
          {JOURS_COURTS.map((j) => (
            <div
              key={j}
              className="px-1 md:px-2.5 py-2 text-center md:text-left text-[11px] font-bold uppercase tracking-[0.06em] text-faint"
            >
              <span className="md:hidden">{j[0]}</span>
              <span className="hidden md:inline">{j}</span>
            </div>
          ))}
        </div>

        {grilleMois(date).map((semaine) => (
          <div
            key={semaine[0]}
            className="grid grid-cols-7 border-b border-line last:border-b-0"
          >
            {semaine.map((jour) => {
              const items = jours.get(jour) ?? [];
              const horsMois = jour.slice(0, 7) !== mois;
              const choisi = jour === jourChoisi;
              const estAujourdhui = jour === aujourdhui;
              return (
                <Link
                  key={jour}
                  href={lienJour(jour)}
                  scroll={false}
                  aria-current={choisi ? "date" : undefined}
                  aria-label={`${fmtJour(jour, { weekday: "long", day: "numeric", month: "long" })} — ${
                    items.length
                      ? `${items.length} élément${items.length > 1 ? "s" : ""}`
                      : "rien de prévu"
                  }`}
                  className={`relative min-h-[58px] md:min-h-[116px] p-1 md:p-1.5 border-l border-line first:border-l-0 no-underline flex flex-col gap-1 min-w-0 transition-colors ${
                    choisi
                      ? "bg-accent-soft/60"
                      : horsMois
                        ? "bg-surface-2/60 hover:bg-surface-2"
                        : "hover:bg-surface-2"
                  }`}
                >
                  {choisi ? (
                    <span
                      aria-hidden
                      className="absolute inset-0 border-2 border-accent pointer-events-none"
                    />
                  ) : null}
                  <span
                    className={`self-center md:self-start w-7 h-7 rounded-full flex items-center justify-center text-[12.5px] font-semibold tabular-nums ${
                      estAujourdhui
                        ? "bg-accent text-white"
                        : horsMois
                          ? "text-faint"
                          : "text-ink"
                    }`}
                  >
                    {Number(jour.slice(8))}
                  </span>

                  {/* Sur ordinateur : les premiers éléments en toutes lettres. */}
                  <span className="hidden md:flex flex-col gap-[3px] min-w-0">
                    {items.slice(0, 3).map((e) => (
                      <PuceAgenda key={e.id} element={e} />
                    ))}
                    {items.length > 3 ? (
                      <span className="text-[11px] font-semibold text-muted px-1.5">
                        + {items.length - 3} autre{items.length > 4 ? "s" : ""}
                      </span>
                    ) : null}
                  </span>

                  {/* Sur téléphone : une pastille par élément. */}
                  <span className="md:hidden flex justify-center gap-[3px] flex-wrap">
                    {items.slice(0, 4).map((e) => (
                      <span
                        key={e.id}
                        className={`w-1.5 h-1.5 rounded-full ${
                          e.urgent ? "bg-accent-strong" : TEINTES[e.type].point
                        } ${e.fait ? "opacity-40" : ""}`}
                      />
                    ))}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </Card>

      <section id="jour" className="mt-5 scroll-mt-24">
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
          <h2 className="m-0 text-[18px]">
            <TitreJour jour={jourChoisi} aujourdhui={aujourdhui} />
          </h2>
          <NouveauRappel
            jour={jourChoisi}
            retour={retour}
            libelle="Rappel ce jour-là"
            discret
          />
        </div>
        <ListeElements
          elements={jours.get(jourChoisi) ?? []}
          retour={retour}
          vide="Rien de prévu ce jour-là."
        />
      </section>
    </>
  );
}

/* ============================ Semaine ============================ */

/** Hauteur d'une heure dans la grille, en pixels. */
const HEURE_PX = 52;

/**
 * Colonnes côte à côte pour les éléments qui se chevauchent : chacun prend la
 * première colonne libre à son heure de début.
 */
function enColonnes(items: ElementAgenda[]) {
  const fins: number[] = [];
  const places = items.map((e) => {
    const debut = enMinutes(e.debut!);
    const fin = e.fin ? enMinutes(e.fin) : debut + 60;
    let col = fins.findIndex((f) => f <= debut);
    if (col === -1) col = fins.push(fin) - 1;
    else fins[col] = fin;
    return { e, debut, fin: Math.max(fin, debut + 30), col };
  });
  return { places, colonnes: Math.max(1, fins.length) };
}

export function VueSemaine({
  date,
  aujourdhui,
  elements,
  lienJour,
  retour,
}: {
  date: string;
  aujourdhui: string;
  elements: ElementAgenda[];
  lienJour: (jour: string) => string;
  retour: string;
}) {
  const jours = joursSemaine(date);
  const parJ = parJour(elements);

  const horaires = elements.filter((e) => e.debut);
  // Plage affichée : 7 h – 21 h, élargie si un élément en déborde.
  const premiere = Math.min(
    7,
    ...horaires.map((e) => Math.floor(enMinutes(e.debut!) / 60)),
  );
  const derniere = Math.max(
    21,
    ...horaires.map((e) =>
      Math.min(
        24,
        Math.ceil(enMinutes(e.fin ?? e.debut!) / 60) + (e.fin ? 0 : 1),
      ),
    ),
  );
  const heures = Array.from(
    { length: derniere - premiere },
    (_, i) => premiere + i,
  );

  return (
    <>
      {/* Ordinateur : grille horaire. */}
      <Card className="hidden md:block overflow-hidden">
        <div className="grid grid-cols-[58px_repeat(7,minmax(0,1fr))] bg-surface-2 border-b border-line">
          <div />
          {jours.map((jour, i) => (
            <Link
              key={jour}
              href={lienJour(jour)}
              className="px-2 py-2 border-l border-line no-underline text-ink hover:bg-surface-3"
            >
              <span className="block text-[11px] font-bold uppercase tracking-[0.06em] text-faint">
                {JOURS_COURTS[i]}
              </span>
              <span
                className={`mt-0.5 inline-flex w-7 h-7 rounded-full items-center justify-center text-[14px] font-semibold tabular-nums ${
                  jour === aujourdhui ? "bg-accent text-white" : ""
                }`}
              >
                {Number(jour.slice(8))}
              </span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-[58px_repeat(7,minmax(0,1fr))] border-b border-line">
          <div className="px-2 py-2 text-[10.5px] font-semibold text-faint text-right">
            Journée
          </div>
          {jours.map((jour) => (
            <div
              key={jour}
              className="border-l border-line p-1 flex flex-col gap-[3px] min-h-[34px] min-w-0"
            >
              {(parJ.get(jour) ?? [])
                .filter((e) => !e.debut)
                .map((e) => (
                  <BlocSemaine
                    key={e.id}
                    element={e}
                    retour={retour}
                    className="block"
                  >
                    <PuceAgenda element={e} />
                  </BlocSemaine>
                ))}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[58px_repeat(7,minmax(0,1fr))]">
          <div className="relative">
            {heures.map((h, i) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[10.5px] tabular-nums text-faint"
                style={{ top: i * HEURE_PX }}
              >
                {i === 0 ? "" : `${h} h`}
              </div>
            ))}
          </div>
          {jours.map((jour) => {
            const { places, colonnes } = enColonnes(
              (parJ.get(jour) ?? []).filter((e) => e.debut),
            );
            return (
              <div
                key={jour}
                className={`relative border-l border-line ${
                  jour === aujourdhui ? "bg-accent-soft/25" : ""
                }`}
                style={{ height: heures.length * HEURE_PX }}
              >
                {heures.map((h, i) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-line/70"
                    style={{ top: i * HEURE_PX }}
                  />
                ))}
                {places.map(({ e, debut, fin, col }) => {
                  const haut = ((debut - premiere * 60) / 60) * HEURE_PX;
                  const hauteur = Math.max(
                    22,
                    ((Math.min(fin, derniere * 60) - debut) / 60) * HEURE_PX -
                      2,
                  );
                  return (
                    <BlocSemaine
                      key={e.id}
                      element={e}
                      retour={retour}
                      className={`absolute overflow-hidden rounded-[6px] border-l-[3px] px-1.5 py-1 text-[11.5px] leading-tight no-underline hover:brightness-95 ${
                        e.urgent
                          ? "bg-accent-strong text-white border-l-accent-strong"
                          : `${TEINTES[e.type].puce} ${TEINTES[e.type].bord}`
                      } ${e.fait ? "opacity-60" : ""}`}
                      style={{
                        top: haut + 1,
                        height: hauteur,
                        left: `calc(${(col / colonnes) * 100}% + 2px)`,
                        width: `calc(${100 / colonnes}% - 4px)`,
                      }}
                    >
                      <span className="block font-bold tabular-nums">
                        {plageHoraire(e.debut, e.fin)}
                      </span>
                      <span
                        className={`block font-semibold ${e.fait ? "line-through" : ""}`}
                      >
                        {e.titre}
                      </span>
                    </BlocSemaine>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Téléphone : les sept jours les uns sous les autres. */}
      <div className="md:hidden flex flex-col gap-5">
        {jours.map((jour) => (
          <JourListe
            key={jour}
            jour={jour}
            aujourdhui={aujourdhui}
            elements={parJ.get(jour) ?? []}
            retour={retour}
            vide="Rien de prévu."
          />
        ))}
      </div>
    </>
  );
}

/** Un élément de la grille : sa page, ou la modification d'un rappel. */
function BlocSemaine({
  element,
  retour,
  className,
  style,
  children,
}: {
  element: ElementAgenda;
  retour: string;
  className: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  if (element.href) {
    return (
      <Link
        href={element.href}
        title={element.titre}
        className={className}
        style={style}
      >
        {children}
      </Link>
    );
  }
  return (
    <BlocRappel
      element={element}
      retour={retour}
      className={className}
      style={style}
    >
      {children}
    </BlocRappel>
  );
}

/* ============================ À venir ============================ */

export function VueListe({
  du,
  au,
  aujourdhui,
  elements,
  lienSuite,
  retour,
}: {
  du: string;
  au: string;
  aujourdhui: string;
  elements: ElementAgenda[];
  lienSuite: string;
  retour: string;
}) {
  const jours = parJour(elements);

  return (
    <>
      {jours.size ? (
        <div className="flex flex-col gap-6">
          {[...jours].map(([jour, items]) => (
            <JourListe
              key={jour}
              jour={jour}
              aujourdhui={aujourdhui}
              elements={items}
              retour={retour}
            />
          ))}
        </div>
      ) : (
        <div className="px-5 py-11 text-center text-muted border border-dashed border-line rounded-[var(--radius-m)]">
          Rien de prévu du {fmtJour(du, { day: "numeric", month: "long" })} au{" "}
          {fmtJour(au)}.
        </div>
      )}
      <div className="mt-6 flex justify-center">
        <Link
          href={lienSuite}
          className="btn-contour btn-contour-sm text-accent hover:bg-accent-soft"
        >
          Plus loin, à partir du{" "}
          {fmtJour(ajouterJours(au, 1), { day: "numeric", month: "long" })}
          <ArrowRight size={14} />
        </Link>
      </div>
    </>
  );
}

/* ============================ Listes ============================ */

/** « Aujourd'hui 17 septembre », « Mardi 22 septembre ». */
function TitreJour({ jour, aujourdhui }: { jour: string; aujourdhui: string }) {
  const proche = Math.abs(ecartJours(aujourdhui, jour)) <= 1;
  return (
    <>
      {jourRelatif(jour, aujourdhui)}
      {proche ? (
        <span className="font-normal text-muted text-[0.86em] ml-2">
          {fmtJour(jour, { weekday: "long", day: "numeric", month: "long" })}
        </span>
      ) : null}
    </>
  );
}

function JourListe({
  jour,
  aujourdhui,
  elements,
  retour,
  vide,
}: {
  jour: string;
  aujourdhui: string;
  elements: ElementAgenda[];
  retour: string;
  vide?: string;
}) {
  return (
    <section>
      <h3
        className={`m-0 mb-2 text-[14px] font-semibold ${
          jour === aujourdhui ? "text-accent" : "text-ink"
        }`}
      >
        <TitreJour jour={jour} aujourdhui={aujourdhui} />
      </h3>
      <ListeElements elements={elements} retour={retour} vide={vide} />
    </section>
  );
}

function ListeElements({
  elements,
  retour,
  vide,
}: {
  elements: ElementAgenda[];
  retour: string;
  vide?: string;
}) {
  if (!elements.length) {
    return vide ? (
      <p className="m-0 text-[13px] text-faint px-3.5 py-3 border border-dashed border-line rounded-[var(--radius-s)]">
        {vide}
      </p>
    ) : null;
  }
  return (
    <div className="flex flex-col gap-2">
      {elements.map((e) => (
        <CarteElement key={e.id} element={e} retour={retour} />
      ))}
    </div>
  );
}
