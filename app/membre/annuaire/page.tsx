import { Search } from "lucide-react";
import { MemberCard } from "@/components/domain";
import { EmptyState, Saillant, ViewHead } from "@/components/ui";
import { getMembresAnnuaire } from "@/lib/queries";

/**
 * Le filtrage passe par l'URL plutôt que par un état client : la recherche
 * reste partageable, et la page fonctionne sans JavaScript.
 */
export default async function AnnuairePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; secteur?: string }>;
}) {
  const [{ q = "", secteur = "" }, visibles] = await Promise.all([
    searchParams,
    // Une candidature n'est pas encore un membre : elle est exclue par la requête.
    getMembresAnnuaire(),
  ]);
  const secteurs = [...new Set(visibles.map((m) => m.secteur))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );

  const needle = q.toLowerCase();
  const list = visibles
    .filter(
      (m) =>
        !needle ||
        `${m.nom}${m.secteur}${m.ville}`.toLowerCase().includes(needle),
    )
    .filter((m) => !secteur || m.secteur === secteur)
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  return (
    <>
      <ViewHead title={<>Annuaire des {<Saillant>membres</Saillant>}</>}>
        {visibles.length} entreprises membres, classées par ordre alphabétique.
        Logo, contact et produits phares pour faciliter la mise en relation.
      </ViewHead>

      <form className="flex gap-3 flex-wrap mb-[18px]">
        <div className="relative max-w-[340px] flex-1 min-w-[240px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
          />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Rechercher par nom, secteur ou ville…"
            className="w-full border border-line bg-surface text-ink rounded-[var(--radius-s)] pl-[34px] pr-3 py-[9px] text-[13.6px]"
          />
        </div>
        <select
          name="secteur"
          defaultValue={secteur}
          className="max-w-[280px] flex-1 min-w-[200px] border border-line bg-surface text-ink rounded-[var(--radius-s)] px-3 py-[9px] text-[13.6px]"
        >
          <option value="">Tous les secteurs</option>
          {secteurs.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="text-[13.4px] font-semibold px-[15px] py-[9px] rounded-[var(--radius-s)] bg-accent text-white border border-transparent cursor-pointer hover:bg-accent-strong"
        >
          Filtrer
        </button>
      </form>

      {list.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              href={`/membre/annuaire/${m.id}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState>Aucun membre ne correspond à cette recherche.</EmptyState>
      )}
    </>
  );
}
