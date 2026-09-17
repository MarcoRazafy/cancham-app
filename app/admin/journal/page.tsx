import Link from "next/link";
import { ChevronLeft, ChevronRight, History, Search } from "lucide-react";
import { EnTeteAdmin, Onglets, Vide } from "@/components/admin/ui";
import { LigneJournal } from "@/components/admin/LigneJournal";
import { Card, Saillant } from "@/components/ui";
import { FAMILLES_JOURNAL, type FamilleJournal } from "@/lib/journal";
import { getJournal } from "@/lib/queries-admin";

const PAR_PAGE = 25;

export default async function Journal({
  searchParams,
}: {
  searchParams: Promise<{ famille?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const famille =
    params.famille && params.famille in FAMILLES_JOURNAL
      ? (params.famille as FamilleJournal)
      : undefined;
  const recherche = params.q?.trim() || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { entrees, total } = await getJournal({
    limite: PAR_PAGE,
    page,
    famille,
    recherche,
  });
  const pages = Math.max(1, Math.ceil(total / PAR_PAGE));

  /** Adresse de la même vue avec un paramètre changé. */
  const lien = (changes: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const tout = { famille, q: recherche, page: String(page), ...changes };
    for (const [k, v] of Object.entries(tout))
      if (v && !(k === "page" && v === "1")) p.set(k, v);
    const qs = p.toString();
    return `/admin/journal${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <EnTeteAdmin
        surtitre="Pilotage"
        titre={
          <>
            Journal <Saillant>d’activité</Saillant>
          </>
        }
      >
        Chaque opération sensible laisse une trace : paiements, validations,
        suppressions, publications. Rien ne disparaît sans qu’on sache qui, quoi
        et quand.
      </EnTeteAdmin>

      <Onglets
        actif={famille ?? "tout"}
        onglets={[
          {
            cle: "tout",
            libelle: "Tout",
            href: lien({ famille: undefined, page: "1" }),
          },
          ...Object.entries(FAMILLES_JOURNAL).map(([cle, libelle]) => ({
            cle,
            libelle,
            href: lien({ famille: cle, page: "1" }),
          })),
        ]}
      />

      <form action="/admin/journal" className="mb-4 flex gap-2 max-w-[460px]">
        {famille ? (
          <input type="hidden" name="famille" value={famille} />
        ) : null}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
          />
          <input
            type="search"
            name="q"
            defaultValue={recherche ?? ""}
            placeholder="Membre, facture, auteur…"
            aria-label="Rechercher dans le journal"
            className="w-full rounded-[var(--radius-s)] border border-line bg-surface text-ink pl-9 pr-3 py-2.5 text-[13.5px] outline-none focus:border-accent"
          />
        </div>
        <button
          type="submit"
          className="btn-contour btn-contour-sm text-ink hover:bg-surface-2"
        >
          Filtrer
        </button>
      </form>

      <Card className="px-6 py-2">
        {entrees.length ? (
          entrees.map((e) => <LigneJournal key={e.id} entree={e} />)
        ) : (
          <Vide icone={<History size={26} />}>
            {recherche
              ? `Aucune opération ne correspond à « ${recherche} ».`
              : "Aucune opération enregistrée."}
          </Vide>
        )}
      </Card>

      <div className="flex items-center justify-between gap-4 mt-4 text-[13px] text-muted">
        <span>
          {total} opération{total > 1 ? "s" : ""}
          {pages > 1 ? ` · page ${page} sur ${pages}` : ""}
        </span>
        {pages > 1 ? (
          <span className="flex gap-2">
            {page > 1 ? (
              <Link
                href={lien({ page: String(page - 1) })}
                className="btn-contour btn-contour-sm text-ink no-underline hover:bg-surface-2"
              >
                <ChevronLeft size={14} /> Précédentes
              </Link>
            ) : null}
            {page < pages ? (
              <Link
                href={lien({ page: String(page + 1) })}
                className="btn-contour btn-contour-sm text-ink no-underline hover:bg-surface-2"
              >
                Suivantes <ChevronRight size={14} />
              </Link>
            ) : null}
          </span>
        ) : null}
      </div>
    </>
  );
}
