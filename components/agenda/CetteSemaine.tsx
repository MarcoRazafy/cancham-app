import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { PointType } from "@/components/agenda/ElementAgenda";
import { Card, Saillant } from "@/components/ui";
import {
  ecartJours,
  fmtJour,
  jourRelatif,
  fmtHeure,
  type ElementAgenda,
} from "@/lib/agenda";

/**
 * Les prochains jours de l'agenda, sur la vue d'ensemble.
 *
 * Faute d'envoi de courriels, c'est ici — avec la cloche — qu'un rappel ou une
 * échéance se voit sans ouvrir l'agenda.
 */
export function CetteSemaine({
  elements,
  aujourdhui,
}: {
  elements: ElementAgenda[];
  aujourdhui: string;
}) {
  return (
    <Card className="carte-filet filet-fixe filet-bleu p-6 mb-5">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-3">
        <div>
          <h2 className="text-[19px] m-0">
            Votre <Saillant>semaine</Saillant>
          </h2>
          <p className="text-[13.5px] text-muted m-0 mt-1">
            Événements, échéances et rappels des sept prochains jours
          </p>
        </div>
        <Link
          href="/membre/agenda"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent no-underline hover:underline"
        >
          Ouvrir l’agenda <ArrowRight size={14} />
        </Link>
      </div>

      {elements.length ? (
        <ul className="m-0 p-0 list-none flex flex-col">
          {elements.map((e, i) => {
            return (
              <li
                key={e.id}
                className={
                  i < elements.length - 1 ? "border-b border-line" : ""
                }
              >
                <Link
                  href={
                    e.href ?? `/membre/agenda?date=${e.jour}&jour=${e.jour}`
                  }
                  className="flex items-center gap-3.5 py-3 no-underline group"
                >
                  <span className="w-[92px] shrink-0 text-[12.5px] leading-tight">
                    <span
                      className={`block font-semibold ${
                        e.jour === aujourdhui ? "text-accent" : "text-ink"
                      }`}
                    >
                      {ecartJours(aujourdhui, e.jour) <= 1
                        ? jourRelatif(e.jour, aujourdhui)
                        : fmtJour(e.jour, {
                            weekday: "short",
                            day: "numeric",
                          })}
                    </span>
                    <span className="block text-faint tabular-nums">
                      {e.debut ? fmtHeure(e.debut) : "Journée"}
                    </span>
                  </span>
                  <PointType type={e.type} />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-[14.5px] font-semibold truncate ${
                        e.urgent ? "text-bad" : "text-ink"
                      } ${e.fait ? "line-through text-muted" : ""}`}
                    >
                      {e.titre}
                    </span>
                    {e.lieu || e.detail ? (
                      <span className="block text-[12.5px] text-muted truncate">
                        {[e.lieu, e.detail].filter(Boolean).join(" · ")}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight
                    size={17}
                    className="text-faint shrink-0 group-hover:text-accent"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="m-0 text-[13.5px] text-muted py-2">
          Rien de prévu cette semaine.{" "}
          <Link href="/membre/agenda" className="text-accent font-semibold">
            Ajouter un rappel
          </Link>
        </p>
      )}
    </Card>
  );
}
