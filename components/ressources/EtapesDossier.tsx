import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { Card } from "@/components/ui";
import type { Resource } from "@/lib/types";
import { EtapeEnVue } from "./EtapeEnVue";

export function EtapesDossier({
  space,
  dossier,
  etapes,
  courante,
}: {
  space: "membre" | "admin";
  dossier: { id: string; nom: string };
  etapes: Resource[];
  courante: string;
}) {
  const faites = etapes.filter((e) => e.terminee).length;
  const pct = etapes.length ? Math.round((faites / etapes.length) * 100) : 0;

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-line px-5 pb-4 pt-5">
        <span className="surtitre text-faint">Dossier</span>
        <Link
          href={`/${space}/ressources?dossier=${dossier.id}`}
          className="mt-1 block text-[16px] font-semibold leading-snug text-ink no-underline [overflow-wrap:anywhere] hover:text-accent"
        >
          {dossier.nom}
        </Link>
        {space === "membre" ? (
          <>
            <div className="mt-3 flex items-baseline justify-between gap-3 text-[12.4px] text-muted">
              <span>
                {faites} étape{faites > 1 ? "s" : ""} terminée
                {faites > 1 ? "s" : ""} sur {etapes.length}
              </span>
              <span className="font-semibold tabular-nums text-ink">
                {pct} %
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-success"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        ) : (
          <p className="m-0 mt-1 text-[12.4px] text-muted">
            {etapes.length} ressource{etapes.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      <ol className="relative m-0 max-h-[min(62vh,600px)] list-none overflow-y-auto p-2">
        {etapes.map((e, i) => {
          const ici = e.id === courante;
          const fermee = e.accessible === false;
          return (
            <li key={e.id}>
              {ici ? <EtapeEnVue /> : null}
              <Link
                href={`/${space}/ressources/${e.id}`}
                aria-current={ici ? "step" : undefined}
                className={`flex items-start gap-3 rounded-[var(--radius-s)] px-3 py-2.5 no-underline ${
                  ici ? "bg-accent-soft" : "hover:bg-surface-2"
                }`}
              >
                <span
                  className={`mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${
                    e.terminee
                      ? "bg-success text-white"
                      : ici
                        ? "bg-accent text-white"
                        : fermee
                          ? "bg-surface-3 text-faint"
                          : "border border-line text-muted"
                  }`}
                >
                  {e.terminee ? (
                    <Check size={13} strokeWidth={3} aria-label="Terminée" />
                  ) : fermee ? (
                    <Lock size={11} aria-label="Accès après achat" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={`line-clamp-2 text-[13.4px] leading-snug [overflow-wrap:anywhere] ${
                      ici ? "font-semibold text-accent" : "text-ink"
                    }`}
                  >
                    {e.titre}
                  </span>
                  <span className="mt-0.5 block text-[11.6px] text-faint">
                    {e.fmt} · {e.taille}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
