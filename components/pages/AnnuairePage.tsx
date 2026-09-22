import { Search } from "lucide-react";
import { FiltresAuto } from "@/components/FiltresAuto";
import { MemberCard } from "@/components/domain";
import { EmptyState, Saillant, ViewHead } from "@/components/ui";
import { PROVISOIRE } from "@/lib/accueil";
import { getMembresAnnuaire } from "@/lib/queries";
import { SECTEURS, estSecteur } from "@/lib/secteurs";

export interface ParametresAnnuaire {
  q?: string;
  secteur?: string;
}

/**
 * L'annuaire des membres, le même pour les membres et pour l'équipe : ce que
 * voit l'équipe est ce que voient les adhérents. Seules les fiches s'ouvrent
 * dans l'espace de chacun.
 *
 * Le filtrage passe par l'URL plutôt que par un état client : la recherche
 * reste partageable, et la page fonctionne sans JavaScript.
 */
export async function AnnuairePage({
  espace,
  searchParams,
}: {
  espace: "membre" | "admin";
  searchParams: Promise<ParametresAnnuaire>;
}) {
  const [{ q = "", secteur = "" }, visibles] = await Promise.all([
    searchParams,
    // Une candidature n'est pas encore un membre : elle est exclue par la requête.
    getMembresAnnuaire(),
  ]);
  // Le filtre propose la liste fermée des secteurs. Une fiche saisie avant
  // elle garde son ancien libellé : il s'ajoute à la suite, pour qu'elle
  // reste trouvable. Une étape d'inscription sautée n'est pas un secteur.
  const autresSecteurs = [...new Set(visibles.map((m) => m.secteur))]
    .filter((s) => !estSecteur(s) && s !== PROVISOIRE.secteur)
    .sort((a, b) => a.localeCompare(b, "fr"));

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

      <FiltresAuto className="flex gap-3 flex-wrap mb-[18px]">
        <div className="relative w-full sm:max-w-[340px] sm:flex-1 sm:min-w-[240px]">
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
          className="w-full sm:w-auto sm:max-w-[280px] sm:flex-1 sm:min-w-[200px] border border-line bg-surface text-ink rounded-[var(--radius-s)] px-3 py-[9px] text-[13.6px]"
        >
          <option value="">Tous les secteurs</option>
          {SECTEURS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          {/* Fiches saisies avant la liste fermée : toujours trouvables. */}
          {autresSecteurs.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </FiltresAuto>

      {list.length ? (
        <div className="cascade grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              href={`/${espace}/annuaire/${m.id}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState>Aucun membre ne correspond à cette recherche.</EmptyState>
      )}
    </>
  );
}
