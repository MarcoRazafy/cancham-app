import Link from "next/link";
import { AlertTriangle, Check, ChevronRight, MapPin } from "lucide-react";
import { ActionsRappel } from "@/components/agenda/Rappels";
import {
  plageHoraire,
  type ElementAgenda,
  type TypeElement,
} from "@/lib/agenda";

/**
 * Teintes par type d'élément : des aplats francs, lisibles d'un coup d'œil
 * dans une case de calendrier — un pastel se confond avec le fond.
 *
 * Classes écrites en entier : Tailwind ne voit pas les noms composés à
 * l'exécution.
 */
export const TEINTES: Record<
  TypeElement,
  { point: string; puce: string; bord: string }
> = {
  evenement: {
    point: "bg-navy",
    puce: "bg-navy text-white",
    bord: "border-l-navy",
  },
  inscription: {
    point: "bg-success",
    puce: "bg-success text-white",
    bord: "border-l-success",
  },
  echeance: {
    point: "bg-accent",
    puce: "bg-accent text-white",
    bord: "border-l-accent",
  },
  // Prune écrite en clair : le jeton `bad` vire au rouge dans le back-office,
  // où le rendez-vous se confondrait alors avec une échéance.
  rendezvous: {
    point: "bg-[#5b4b8a]",
    puce: "bg-[#5b4b8a] text-white",
    bord: "border-l-[#5b4b8a]",
  },
  rappel: {
    point: "bg-warn",
    puce: "bg-warn text-white",
    bord: "border-l-warn",
  },
};

/** Une échéance dépassée : le rouge de la charte, poussé plus sombre. */
const URGENT = "bg-accent-strong text-white";

/** Étiquette d'un élément sur sa carte. */
const ETIQUETTES: Record<TypeElement, string> = {
  evenement: "Événement",
  inscription: "Inscrit",
  rendezvous: "Rendez-vous",
  echeance: "Échéance",
  rappel: "Rappel",
};

/** Ce qui est réglé ou fait s'efface : il reste visible, sans réclamer. */
const effacement = (e: ElementAgenda) => (e.fait ? "opacity-60" : "");

/** Élément en une ligne, pour une case du mois ou la journée d'une semaine. */
export function PuceAgenda({ element: e }: { element: ElementAgenda }) {
  return (
    <span
      title={e.titre}
      className={`block truncate text-[11.5px] leading-[1.35] font-semibold px-1.5 py-[2px] rounded-[5px] ${
        e.urgent ? URGENT : TEINTES[e.type].puce
      } ${effacement(e)} ${e.fait ? "line-through" : ""}`}
    >
      {e.debut ? (
        <span className="tabular-nums font-bold mr-1">
          {e.debut.replace(":", "h")}
        </span>
      ) : null}
      {e.titre}
    </span>
  );
}

/** Carte détaillée d'un élément, dans une liste de jours. */
export function CarteElement({
  element: e,
  retour,
}: {
  element: ElementAgenda;
  retour: string;
}) {
  const horaire = plageHoraire(e.debut, e.fin) ?? "Journée";
  const contenu = (
    <>
      <div className="w-[76px] sm:w-[104px] shrink-0 text-[12.5px] font-semibold tabular-nums text-muted pt-[1px]">
        {horaire}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span
            className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.04em] px-2 py-[2px] rounded-full ${TEINTES[e.type].puce}`}
          >
            {ETIQUETTES[e.type]}
          </span>
          {e.urgent ? (
            <span
              className={`inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.04em] px-2 py-[2px] rounded-full ${URGENT}`}
            >
              <AlertTriangle size={11} /> Dépassée
            </span>
          ) : null}
          {e.fait ? (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.04em] px-2 py-[2px] rounded-full bg-success-soft text-success-strong">
              <Check size={11} strokeWidth={3} />
              {e.type === "rappel" ? "Fait" : "Réglée"}
            </span>
          ) : null}
        </div>
        <div
          className={`text-[14.5px] font-semibold text-ink leading-snug ${
            e.fait ? "line-through decoration-faint" : ""
          }`}
        >
          {e.titre}
        </div>
        {e.lieu || e.detail ? (
          <div className="text-[12.5px] text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
            {e.lieu ? (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {e.lieu}
              </span>
            ) : null}
            {e.lieu && e.detail ? <span aria-hidden>·</span> : null}
            {e.detail ? (
              <span className="whitespace-pre-line">{e.detail}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );

  const cadre = `flex items-start gap-3 p-3 pl-3.5 rounded-[var(--radius-s)] border border-line border-l-4 bg-surface ${
    e.urgent ? "border-l-accent-strong" : TEINTES[e.type].bord
  }`;

  if (e.href) {
    return (
      <Link
        href={e.href}
        className={`${cadre} no-underline hover:bg-surface-2 transition-colors`}
      >
        {contenu}
        <ChevronRight size={16} className="text-faint shrink-0 self-center" />
      </Link>
    );
  }
  return (
    <div className={cadre}>
      {contenu}
      <ActionsRappel element={e} retour={retour} />
    </div>
  );
}

/** Légende d'un type : pastille de couleur et libellé. */
export function PointType({ type }: { type: TypeElement }) {
  return (
    <span
      aria-hidden
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${TEINTES[type].point}`}
    />
  );
}
