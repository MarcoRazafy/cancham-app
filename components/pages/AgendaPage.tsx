import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PointType } from "@/components/agenda/ElementAgenda";
import { NouveauRappel } from "@/components/agenda/Rappels";
import { VueListe, VueMois, VueSemaine } from "@/components/agenda/Vues";
import { ViewHead } from "@/components/ui";
import {
  ajouterJours,
  debutMois,
  estJourISO,
  libellePeriode,
  periodeVoisine,
  periodeVue,
  typesElement,
  VUES_AGENDA,
  type EspaceAgenda,
  type TypeElement,
  type VueAgenda,
} from "@/lib/agenda";
import { aujourdhuiISO } from "@/lib/format";
import { getAgenda, getAgendaEquipe } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

interface Etat {
  vue: VueAgenda;
  date: string;
  jour?: string;
  voir: TypeElement[];
}

/**
 * Adresse d'un état de l'agenda, dans un espace. Tout vit dans l'URL : un lien partagé ou un
 * retour arrière retrouve la même vue, sans état côté client.
 */
function lienDans(espace: EspaceAgenda) {
  const types = typesElement(espace);
  return ({ vue, date, jour, voir }: Etat): string => {
    const q = new URLSearchParams();
    if (vue !== "mois") q.set("vue", vue);
    q.set("date", date);
    if (jour) q.set("jour", jour);
    if (voir.length < types.length) {
      q.set("voir", voir.length ? voir.join(",") : "aucun");
    }
    return `/${espace}/agenda?${q}`;
  };
}

function lireVoir(espace: EspaceAgenda, v: string | undefined): TypeElement[] {
  const types = typesElement(espace).map((t) => t.cle);
  if (!v) return types;
  const demandes = v.split(",");
  return types.filter((t) => demandes.includes(t));
}

export interface ParametresAgenda {
  vue?: string;
  date?: string;
  jour?: string;
  voir?: string;
}

/**
 * Agenda complet, partagé par l'espace membre et le back-office : mêmes vues,
 * mêmes rappels. Seul le contenu change — l'équipe voit les échéances de tous
 * les membres, un membre les siennes.
 */
export async function AgendaPage({
  espace,
  searchParams,
}: {
  espace: EspaceAgenda;
  searchParams: Promise<ParametresAgenda>;
}) {
  const p = await searchParams;
  const lien = lienDans(espace);
  const types = typesElement(espace);
  const aujourdhui = aujourdhuiISO();
  const vue: VueAgenda =
    p.vue === "semaine" || p.vue === "liste" ? p.vue : "mois";
  const date = estJourISO(p.date) ? p.date : aujourdhui;
  const voir = lireVoir(espace, p.voir);

  const { du, au } = periodeVue(vue, date);

  // Le jour détaillé sous la grille du mois : celui choisi, sinon aujourd'hui
  // s'il est dans le mois, sinon le premier du mois.
  const jourChoisi =
    estJourISO(p.jour) && p.jour >= du && p.jour <= au
      ? p.jour
      : aujourdhui.slice(0, 7) === date.slice(0, 7)
        ? aujourdhui
        : debutMois(date);

  const user = await getCurrentUser(espace);
  const tous =
    espace === "admin"
      ? await getAgendaEquipe(user.id, du, au)
      : await getAgenda({ userId: user.id, memberId: user.memberId }, du, au);
  const elements = tous.filter((e) => voir.includes(e.type));

  const etat: Etat = {
    vue,
    date,
    jour: vue === "mois" ? jourChoisi : undefined,
    voir,
  };
  const retour = lien(etat);
  // En changeant de vue, on garde le jour regardé plutôt que le début de période.
  const repere = vue === "mois" ? jourChoisi : date;

  return (
    <>
      <ViewHead
        title="Agenda"
        action={
          <NouveauRappel
            jour={vue === "mois" ? jourChoisi : aujourdhui}
            retour={retour}
          />
        }
      >
        {espace === "admin"
          ? "Les événements, les factures à encaisser, les accès qui vont se restreindre et vos rappels, au même endroit."
          : "Les événements de la chambre, vos échéances de cotisation et de factures, et vos rappels, au même endroit."}
      </ViewHead>

      {/* ==================== Barre d'outils ==================== */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-3">
        <div className="flex items-center gap-1.5">
          <Link
            href={lien({
              ...etat,
              jour: undefined,
              date: periodeVoisine(vue, date, -1),
            })}
            aria-label="Période précédente"
            scroll={false}
            className="w-9 h-9 rounded-[var(--radius-s)] border border-line bg-surface text-ink flex items-center justify-center hover:bg-surface-2"
          >
            <ChevronLeft size={17} />
          </Link>
          <Link
            href={lien({ ...etat, jour: undefined, date: aujourdhui })}
            scroll={false}
            className="h-9 px-3.5 rounded-[var(--radius-s)] border border-line bg-surface text-ink text-[13px] font-semibold no-underline flex items-center hover:bg-surface-2"
          >
            Aujourd’hui
          </Link>
          <Link
            href={lien({
              ...etat,
              jour: undefined,
              date: periodeVoisine(vue, date, 1),
            })}
            aria-label="Période suivante"
            scroll={false}
            className="w-9 h-9 rounded-[var(--radius-s)] border border-line bg-surface text-ink flex items-center justify-center hover:bg-surface-2"
          >
            <ChevronRight size={17} />
          </Link>
        </div>

        <h2 className="m-0 text-[20px] flex-1 min-w-[190px]" aria-live="polite">
          {libellePeriode(vue, date)}
        </h2>

        <nav
          aria-label="Affichage"
          className="flex p-[3px] rounded-[var(--radius-s)] bg-surface-3 w-full sm:w-auto"
        >
          {VUES_AGENDA.map((v) => (
            <Link
              key={v.cle}
              href={lien({
                ...etat,
                vue: v.cle,
                date: repere,
                jour: undefined,
              })}
              aria-current={v.cle === vue ? "page" : undefined}
              scroll={false}
              className={`flex-1 sm:flex-none text-center px-3.5 py-1.5 rounded-[6px] text-[13px] font-semibold no-underline ${
                v.cle === vue
                  ? "bg-surface text-ink shadow-[var(--shadow)]"
                  : "text-muted hover:text-ink"
              }`}
            >
              {v.libelle}
            </Link>
          ))}
        </nav>
      </div>

      {/* ==================== Filtres, qui servent de légende ==================== */}
      <div className="flex flex-wrap gap-2 mb-5" aria-label="Afficher">
        {types.map((t) => {
          const actif = voir.includes(t.cle);
          const nombre = tous.filter((e) => e.type === t.cle).length;
          return (
            <Link
              key={t.cle}
              href={lien({
                ...etat,
                voir: actif
                  ? voir.filter((x) => x !== t.cle)
                  : [...voir, t.cle],
              })}
              scroll={false}
              aria-pressed={actif}
              className={`inline-flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full border text-[12.5px] font-semibold no-underline transition-colors ${
                actif
                  ? "border-line bg-surface text-ink hover:bg-surface-2"
                  : "border-dashed border-line bg-transparent text-faint line-through hover:text-muted"
              }`}
            >
              <PointType type={t.cle} />
              {t.libelle}
              <span className="tabular-nums text-faint font-medium">
                {nombre}
              </span>
            </Link>
          );
        })}
      </div>

      {vue === "mois" ? (
        <VueMois
          date={date}
          aujourdhui={aujourdhui}
          jourChoisi={jourChoisi}
          elements={elements}
          lienJour={(jour) =>
            lien({
              ...etat,
              date: jour.slice(0, 7) === date.slice(0, 7) ? date : jour,
              jour,
            })
          }
          retour={retour}
        />
      ) : vue === "semaine" ? (
        <VueSemaine
          date={date}
          aujourdhui={aujourdhui}
          elements={elements}
          lienJour={(jour) => lien({ ...etat, vue: "mois", date: jour, jour })}
          retour={retour}
        />
      ) : (
        <VueListe
          du={du}
          au={au}
          aujourdhui={aujourdhui}
          elements={elements}
          lienSuite={lien({ ...etat, date: ajouterJours(au, 1) })}
          retour={retour}
        />
      )}
    </>
  );
}
