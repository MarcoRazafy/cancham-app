import Link from "next/link";
import {
  Building2,
  CalendarDays,
  FileText,
  Newspaper,
  Search,
} from "lucide-react";
import { Card, EmptyState, Pill, ViewHead } from "@/components/ui";
import { TexteLie } from "@/components/TexteLie";
import { rechercher, type ResultatRecherche } from "@/lib/queries";
import type { Space } from "@/lib/types";

const ICONES = {
  membre: Building2,
  evenement: CalendarDays,
  actualite: Newspaper,
  ressource: FileText,
} as const;

const LIBELLES = {
  membre: "Membre",
  evenement: "Événement",
  actualite: "Actualité",
  ressource: "Ressource",
} as const;

export async function RecherchePage({ space, q }: { space: Space; q: string }) {
  const terme = q.trim();
  const resultats = await rechercher(terme, space);

  const groupes = (["membre", "evenement", "actualite", "ressource"] as const)
    .map((type) => ({ type, items: resultats.filter((r) => r.type === type) }))
    .filter((g) => g.items.length);

  return (
    <>
      <ViewHead title={terme ? `Recherche : « ${terme} »` : "Recherche"}>
        {terme.length >= 2
          ? `${resultats.length} résultat${resultats.length > 1 ? "s" : ""} dans l’annuaire, les événements, les actualités et les ressources.`
          : "Saisissez au moins deux caractères dans le champ de recherche, en haut de la page."}
      </ViewHead>

      {terme.length < 2 ? (
        <EmptyState>
          <Search size={20} className="mx-auto mb-2 text-faint" />
          La recherche porte sur le nom, le secteur et la ville des membres,
          ainsi que sur les titres et les descriptions des contenus.
        </EmptyState>
      ) : resultats.length ? (
        <div className="flex flex-col gap-6">
          {groupes.map((g) => {
            const Icone = ICONES[g.type];
            return (
              <section key={g.type}>
                <div className="flex items-center gap-2 mb-2.5">
                  <Icone size={15} className="text-accent" />
                  <h2 className="text-[13px] m-0 font-semibold uppercase tracking-[0.06em] text-faint">
                    {LIBELLES[g.type]}
                    {g.items.length > 1 ? "s" : ""}
                  </h2>
                  <Pill>{g.items.length}</Pill>
                </div>
                <Card className="p-0 overflow-hidden">
                  {g.items.map((r: ResultatRecherche, i) => (
                    <Link
                      key={`${r.type}-${r.id}`}
                      href={r.href}
                      className={`block px-4 py-3 no-underline hover:bg-surface-2 ${
                        i < g.items.length - 1 ? "border-b border-line" : ""
                      }`}
                    >
                      <div className="text-[13.6px] font-semibold text-ink">
                        {r.titre}
                      </div>
                      <div className="text-[12px] text-muted">
                        <TexteLie texte={r.detail} dansUnLien />
                      </div>
                    </Link>
                  ))}
                </Card>
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState>Aucun résultat pour « {terme} ».</EmptyState>
      )}
    </>
  );
}
