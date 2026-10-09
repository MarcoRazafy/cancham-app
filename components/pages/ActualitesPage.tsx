import Link from "next/link";
import { Globe, LayoutDashboard, Newspaper, Pencil, Plus } from "lucide-react";
import { AvatarRond, NewsFeedItem, OfferCard } from "@/components/domain";
import {
  ComposeurPublication,
  SupprimerMaPublication,
} from "@/components/forms/ComposeurPublication";
import {
  OffreButton,
  SupprimerActualiteButton,
  SupprimerOffreButton,
} from "@/components/forms/AdminContenuForms";
import { EmptyState, ViewHead } from "@/components/ui";
import { OFFRES_DU_RAIL, type EmplacementOffre } from "@/lib/offres";
import {
  getDernieresOffres,
  getMember,
  getMembers,
  getNews,
  getOffers,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import type { Space } from "@/lib/types";

const OU: Record<EmplacementOffre, string> = {
  actualites: "Actualités",
  tableau_de_bord: "Tableau de bord",
  partout: "Actualités + tableau de bord",
};

export async function ActualitesPage({
  space,
  voir,
}: {
  space: Space;
  voir?: string;
}) {
  const admin = space === "admin";
  const base = `/${space}/actualites`;
  const user = await getCurrentUser(space);
  const [fil, toutes, membres, entreprise] = await Promise.all([
    getNews(user.id),
    admin ? getOffers() : getDernieresOffres(OFFRES_DU_RAIL, "actualites"),
    admin ? getMembers() : Promise.resolve([]),
    !admin && user.memberId ? getMember(user.memberId) : Promise.resolve(null),
  ]);
  const miennes = !admin && voir === "miennes";
  const feed = miennes
    ? fil.filter((n) => n.auteur?.membreId === user.memberId)
    : fil;
  const avatar = entreprise ? (
    <AvatarRond
      src={entreprise.logo}
      alt=""
      initiales={entreprise.nom.slice(0, 2).toUpperCase()}
      taille={44}
      ajuste="contenu"
      className="shrink-0 border border-line bg-surface-2 text-[13px] font-bold text-muted"
    />
  ) : null;
  const duRail = toutes
    .filter((o) => o.emplacement !== "tableau_de_bord")
    .slice(0, OFFRES_DU_RAIL);
  const offers = admin ? toutes : duRail;
  const proposants = membres
    .filter((m) => m.statut !== "candidature")
    .map((m) => ({ id: m.id, nom: m.nom }));

  return (
    <>
      <div className="grid gap-7 items-start xl:grid-cols-2">
        <div className="min-w-0">
          <ViewHead
            title="Actualités"
            action={
              admin ? (
                <Link
                  href={`${base}/nouvelle`}
                  className="btn-action btn-action-sm no-underline"
                >
                  <Plus size={15} /> Nouvelle actualité
                </Link>
              ) : undefined
            }
          />

          {entreprise ? (
            <>
              <ComposeurPublication
                entreprise={entreprise.nom}
                avatar={avatar}
              />
              <nav
                aria-label="Filtrer le fil"
                className="mb-3 inline-flex rounded-full border border-line bg-surface p-1"
              >
                {(
                  [
                    ["Toutes les publications", base, !miennes],
                    ["Mes publications", `${base}?voir=miennes`, miennes],
                  ] as const
                ).map(([libelle, href, actif]) => (
                  <Link
                    key={libelle}
                    href={href}
                    aria-current={actif ? "page" : undefined}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold no-underline transition-colors ${
                      actif
                        ? "bg-accent text-white"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {libelle}
                  </Link>
                ))}
              </nav>
            </>
          ) : null}

          {miennes && !feed.length ? (
            <EmptyState>
              Vous n’avez encore rien publié. Écrivez quelques mots dans la
              barre ci-dessus.
            </EmptyState>
          ) : null}

          {feed.map((n) => (
            <NewsFeedItem
              key={n.id}
              news={n}
              base={base}
              space={space}
              actions={
                admin ? (
                  <>
                    {n.public ? (
                      <span
                        title="Diffusée aussi sur la page publique"
                        className="inline-flex items-center gap-1 h-9 px-2.5 rounded-[var(--radius-s)] border border-line bg-surface text-[12px] font-semibold text-success-strong"
                      >
                        <Globe size={13} /> Page publique
                      </span>
                    ) : null}
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
                ) : entreprise && n.auteur?.membreId === entreprise.id ? (
                  <>
                    <ComposeurPublication
                      key={`${n.corps}|${n.images.join("|")}`}
                      entreprise={entreprise.nom}
                      avatar={avatar}
                      publication={{
                        id: n.id,
                        texte: n.corps,
                        images: n.images,
                      }}
                    />
                    <SupprimerMaPublication
                      newsId={n.id}
                      commentaires={n.commentaires.length}
                    />
                  </>
                ) : undefined
              }
            />
          ))}
        </div>

        <aside className={`min-w-0 ${admin ? "" : "xl:sticky xl:top-[84px]"}`}>
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
                    className="xl:max-h-[max(220px,calc((100dvh-200px)/2))]"
                    etiquette={
                      admin ? (
                        <>
                          {o.emplacement === "tableau_de_bord" ? (
                            <LayoutDashboard size={12} aria-hidden />
                          ) : (
                            <Newspaper size={12} aria-hidden />
                          )}
                          {OU[o.emplacement ?? "partout"]}
                        </>
                      ) : undefined
                    }
                  />
                );
                return admin ? (
                  <div key={o.id} className="flex flex-col gap-1.5">
                    {carte}
                    <div className="flex items-center justify-end gap-1.5">
                      {o.emplacement !== "tableau_de_bord" &&
                      !duRail.includes(o) ? (
                        <span className="mr-auto text-[12px] leading-snug text-faint">
                          Hors du rail des membres : quatre offres plus récentes
                          passent devant.
                        </span>
                      ) : null}
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
