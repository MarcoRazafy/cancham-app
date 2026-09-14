import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { MediaBanner } from "@/components/domain";
import { BtnLink, Card, Kicker } from "@/components/ui";
import { CommentForm } from "@/components/forms/ContentForms";
import { getNewsItem } from "@/lib/queries";
import { fmtDate } from "@/lib/format";
import type { Space } from "@/lib/types";

export async function ArticlePage({ space, id }: { space: Space; id: string }) {
  const n = await getNewsItem(id);
  if (!n) notFound();

  return (
    <>
      <div className="mb-4">
        <BtnLink href={`/${space}/actualites`} variant="ghost" sm>
          <ArrowLeft size={14} /> Retour aux actualités
        </BtnLink>
      </div>

      <Card className="p-[22px] max-w-[760px]">
        <Kicker>{n.cat}</Kicker>
        <h1 className="mt-2 mb-1.5 text-[24px]">{n.titre}</h1>
        <div className="text-[12.5px] text-faint mb-4">{fmtDate(n.date)}</div>

        {n.image ? (
          <div className="relative w-full aspect-[16/7] rounded-[var(--radius-m)] overflow-hidden">
            <Image
              src={n.image}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 760px"
              className="object-cover"
            />
          </div>
        ) : (
          <MediaBanner media={n.media} lg />
        )}

        <p className="text-[14.6px] leading-[1.75] mt-[18px]">{n.corps}</p>

        <div className="flex items-center gap-2.5 mt-6 mb-3.5">
          <div className="w-[3px] self-stretch min-h-[18px] bg-accent rounded-sm" />
          <h2 className="text-[17px] font-semibold m-0">
            Commentaires{n.commentaires.length ? ` (${n.commentaires.length})` : ""}
          </h2>
        </div>

        {n.commentaires.length ? (
          <div className="flex flex-col gap-2.5">
            {n.commentaires.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex justify-between gap-2.5">
                  <div className="font-semibold text-[13px]">
                    {c.auteur}{" "}
                    <span className="font-normal text-muted">· {c.entreprise}</span>
                  </div>
                  <div className="text-[11.5px] text-faint whitespace-nowrap">
                    {fmtDate(c.date, { day: "numeric", month: "short" })}
                  </div>
                </div>
                <div className="text-[13.4px] mt-1.5 leading-relaxed">{c.texte}</div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-muted text-[13.4px] mb-3.5">
            Aucun commentaire pour le moment.
          </div>
        )}

        <div className="mt-4">
          <CommentForm
            space={space}
            retour={`/${space}/actualites/${n.id}`}
            newsId={n.id}
          />
        </div>
      </Card>
    </>
  );
}
