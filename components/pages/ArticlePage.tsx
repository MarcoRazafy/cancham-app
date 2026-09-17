import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { MediaBanner, OfferCard } from "@/components/domain";
import { BtnLink, Card, EmptyState, Kicker } from "@/components/ui";
import { Agrandir } from "@/components/Agrandir";
import { CommentForm } from "@/components/forms/ContentForms";
import { Reactions } from "@/components/forms/Reactions";
import { TexteLie } from "@/components/TexteLie";
import { getNewsItem, getOffers } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { fmtDate } from "@/lib/format";
import type { Space } from "@/lib/types";

export async function ArticlePage({ space, id }: { space: Space; id: string }) {
  const admin = space === "admin";
  const user = await getCurrentUser(space);
  const [n, offres] = await Promise.all([
    getNewsItem(id, user.id),
    getOffers(),
  ]);
  if (!n) notFound();

  return (
    <>
      <div className="mb-4">
        <BtnLink href={`/${space}/actualites`} variant="ghost" sm>
          <ArrowLeft size={14} /> Retour aux actualités
        </BtnLink>
      </div>

      {/*
        Même composition que le fil : l'article à gauche, les offres dans un
        rail qui le suit au défilement. Seul, l'article laissait un grand vide
        à droite sur tout écran large.
      */}
      <div className="flex gap-7 items-start flex-col xl:flex-row max-w-[1160px]">
        <Card className="p-[22px] flex-1 min-w-0 max-w-[760px] w-full">
          <Kicker>{n.cat}</Kicker>
          <h1 className="mt-2 mb-1.5 text-[24px]">{n.titre}</h1>
          <div className="text-[12.5px] text-faint mb-4">{fmtDate(n.date)}</div>

          {n.image ? (
            <Agrandir src={n.image} alt={n.titre} legende={n.titre}>
              <div className="relative w-full aspect-[16/7] rounded-[var(--radius-m)] overflow-hidden">
                <Image
                  src={n.image}
                  alt={n.titre}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 760px"
                  className="object-cover"
                />
              </div>
            </Agrandir>
          ) : (
            <MediaBanner media={n.media} lg />
          )}

          <p className="text-[14.6px] leading-[1.75] mt-[18px] whitespace-pre-line">
            <TexteLie texte={n.corps} />
          </p>

          <div className="mt-5 pt-4 border-t border-line">
            <Reactions
              newsId={n.id}
              space={space}
              jaimes={n.jaimes}
              jaimeParMoi={n.jaimeParMoi}
              commentaires={n.commentaires.length}
              lienCommentaires="#commentaire"
            />
          </div>

          <div
            id="commentaires"
            className="flex items-center gap-2.5 mt-6 mb-3.5 scroll-mt-24"
          >
            <div className="w-[3px] self-stretch min-h-[18px] bg-accent rounded-sm" />
            <h2 className="text-[17px] font-semibold m-0">
              Commentaires
              {n.commentaires.length ? ` (${n.commentaires.length})` : ""}
            </h2>
          </div>

          {n.commentaires.length ? (
            <div className="flex flex-col gap-2.5">
              {n.commentaires.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex justify-between gap-2.5">
                    <div className="font-semibold text-[13px]">
                      {c.auteur}{" "}
                      <span className="font-normal text-muted">
                        · {c.entreprise}
                      </span>
                    </div>
                    <div className="text-[11.5px] text-faint whitespace-nowrap">
                      {fmtDate(c.date, { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <div className="text-[13.4px] mt-1.5 leading-relaxed whitespace-pre-line">
                    <TexteLie texte={c.texte} />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-muted text-[13.4px] mb-3.5">
              Aucun commentaire pour le moment.
            </div>
          )}

          <div id="commentaire" className="mt-4 scroll-mt-24">
            <CommentForm
              space={space}
              retour={`/${space}/actualites/${n.id}`}
              newsId={n.id}
            />
          </div>
        </Card>

        <aside className="w-full xl:w-[500px] xl:shrink-0 xl:sticky xl:top-[84px]">
          <h2 className="text-sm m-0 mb-2.5 font-semibold uppercase tracking-[0.04em] text-faint">
            Offres &amp; promotions membres
          </h2>
          {offres.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {offres.map((o) => (
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
