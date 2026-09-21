import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { NewsFeedItem, OfferCard } from "@/components/domain";
import {
  OffreButton,
  SupprimerActualiteButton,
  SupprimerOffreButton,
} from "@/components/forms/AdminContenuForms";
import { EmptyState, ViewHead } from "@/components/ui";
import { getMembers, getNews, getOffers } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import type { Space } from "@/lib/types";

/**
 * Fil d'actualité, identique pour le membre et pour l'équipe. L'équipe y
 * trouve en plus ses commandes : publier, modifier, supprimer une actualité,
 * gérer les offres du rail.
 */
export async function ActualitesPage({ space }: { space: Space }) {
  const admin = space === "admin";
  const base = `/${space}/actualites`;
  // La requête rend déjà le fil du plus récent au plus ancien.
  const user = await getCurrentUser(space);
  const [feed, offers, membres] = await Promise.all([
    getNews(user.id),
    getOffers(),
    admin ? getMembers() : Promise.resolve([]),
  ]);
  const proposants = membres
    .filter((m) => m.statut !== "candidature")
    .map((m) => ({ id: m.id, nom: m.nom }));

  return (
    <>
      {/*
          Deux moitiés : le titre et le fil à gauche, les offres à droite, dès
          le haut de la page. Le rail suit le défilement, et ses six offres
          tiennent toujours dans la fenêtre : chaque carte est carrée tant que
          la hauteur de l'écran le permet, et s'aplatit juste ce qu'il faut
          sinon — trois rangées dans la hauteur visible, sous la barre du haut
          et le titre du rail (160 px en tout).
        */}
      <div className="grid gap-7 items-start xl:grid-cols-2">
        <div className="min-w-0">
          <ViewHead
            title="Actualités"
            action={
              admin ? (
                <Link
                  href="/admin/actualites/nouvelle"
                  className="btn-action btn-action-sm no-underline"
                >
                  <Plus size={15} /> Nouvelle actualité
                </Link>
              ) : null
            }
          >
            Le fil d’actualité de la chambre : programmation, retours
            d’événements et vie institutionnelle, dans l’ordre chronologique.
          </ViewHead>

          {feed.map((n) => (
            <NewsFeedItem
              key={n.id}
              news={n}
              base={base}
              space={space}
              actions={
                admin ? (
                  <>
                    <Link
                      href={`/admin/actualites/${n.id}/modifier`}
                      aria-label={`Modifier « ${n.titre} »`}
                      title="Modifier"
                      className="w-9 h-9 rounded-[var(--radius-s)] border border-line bg-surface flex items-center justify-center text-muted hover:text-ink hover:border-faint"
                    >
                      <Pencil size={15} />
                    </Link>
                    <SupprimerActualiteButton
                      newsId={n.id}
                      titre={n.titre}
                      commentaires={n.commentaires.length}
                    />
                  </>
                ) : undefined
              }
            />
          ))}
        </div>

        <aside className="min-w-0 xl:sticky xl:top-[84px]">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <h2 className="text-sm m-0 font-semibold uppercase tracking-[0.04em] text-faint">
              Offres &amp; promotions membres
            </h2>
            {admin ? <OffreButton membres={proposants} /> : null}
          </div>
          {offers.length ? (
            <div className="cascade grid gap-3 sm:grid-cols-2">
              {offers.map((o) => {
                const carte = (
                  <OfferCard
                    key={o.id}
                    offer={o}
                    carre
                    className="xl:max-h-[max(220px,calc((100dvh-160px)/3))]"
                    href={`/${space}/${admin ? "membres" : "annuaire"}/${o.membreId}`}
                  />
                );
                // Les commandes sous la carte, et non dedans : la carte
                // entière est un lien, qui ne peut pas contenir de bouton.
                return admin ? (
                  <div key={o.id} className="flex flex-col gap-1.5">
                    {carte}
                    <div className="flex justify-end gap-1.5">
                      <OffreButton offre={o} membres={proposants} />
                      <SupprimerOffreButton offerId={o.id} titre={o.titre} />
                    </div>
                  </div>
                ) : (
                  carte
                );
              })}
            </div>
          ) : (
            <EmptyState>Aucune offre en vedette pour le moment.</EmptyState>
          )}
        </aside>
      </div>
    </>
  );
}
