import { NewsFeedItem, OfferCard } from "@/components/domain";
import { EmptyState, ViewHead } from "@/components/ui";
import { NewNewsButton, NewOfferButton } from "@/components/forms/ContentForms";
import { getMembers } from "@/lib/queries";
import { getNews, getOffers } from "@/lib/queries";
import type { Space } from "@/lib/types";

/** Fil d'actualité, identique pour le membre et pour l'admin, aux contrôles près. */
export async function ActualitesPage({ space }: { space: Space }) {
  const admin = space === "admin";
  const base = `/${space}/actualites`;
  // La requête rend déjà le fil du plus récent au plus ancien.
  const [feed, offers, membres] = await Promise.all([
    getNews(),
    getOffers(),
    admin ? getMembers() : Promise.resolve([]),
  ]);

  return (
    <>
      <ViewHead
        title="Actualités"
        action={admin ? <NewNewsButton /> : null}
      >
        Le fil d’actualité de la chambre : programmation, retours d’événements et vie
        institutionnelle, dans l’ordre chronologique.
      </ViewHead>

      <div className="flex gap-6 items-start flex-col lg:flex-row max-w-[980px]">
        <div className="flex-1 min-w-0 max-w-[640px]">
          {feed.map((n) => (
            <NewsFeedItem key={n.id} news={n} base={base} />
          ))}
        </div>

        <aside className="w-full lg:w-[280px] lg:shrink-0 lg:sticky lg:top-[84px]">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <h2 className="text-sm m-0 font-semibold uppercase tracking-[0.04em] text-faint">
              Offres &amp; promotions membres
            </h2>
            {admin ? (
              <NewOfferButton
                membres={membres.map((m) => ({ id: m.id, nom: m.nom }))}
              />
            ) : null}
          </div>
          {offers.length ? (
            offers.map((o) => <OfferCard key={o.id} offer={o} />)
          ) : (
            <EmptyState>Aucune offre en vedette pour le moment.</EmptyState>
          )}
        </aside>
      </div>
    </>
  );
}
