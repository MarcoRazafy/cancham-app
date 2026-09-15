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
      <ViewHead title="Actualités" action={admin ? <NewNewsButton /> : null}>
        Le fil d’actualité de la chambre : programmation, retours d’événements
        et vie institutionnelle, dans l’ordre chronologique.
      </ViewHead>

      {/*
          Le rail est assez large pour deux colonnes : à six offres, une
          seule colonne allongeait la page bien au-delà du fil d'actualité
          qu'elle est censée accompagner.
        */}
      <div className="flex gap-7 items-start flex-col xl:flex-row max-w-[1160px]">
        <div className="flex-1 min-w-0 max-w-[620px]">
          {feed.map((n) => (
            <NewsFeedItem key={n.id} news={n} base={base} />
          ))}
        </div>

        <aside className="w-full xl:w-[500px] xl:shrink-0 xl:sticky xl:top-[84px]">
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
            <div className="grid gap-3 sm:grid-cols-2">
              {offers.map((o) => (
                <OfferCard
                  key={o.id}
                  offer={o}
                  href={`/${space}/${admin ? "membres" : "annuaire"}/${o.membreId}`}
                />
              ))}
            </div>
          ) : (
            <EmptyState>Aucune offre en vedette pour le moment.</EmptyState>
          )}
        </aside>
      </div>
    </>
  );
}
