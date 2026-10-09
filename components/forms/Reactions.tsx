"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { MessageSquare, ThumbsUp } from "lucide-react";
import { basculerJaime } from "@/lib/actions/content";
import type { Space } from "@/lib/types";

export function Reactions({
  newsId,
  space,
  jaimes,
  jaimeParMoi,
  commentaires,
  lienCommentaires,
}: {
  newsId: string;
  space: Space;
  jaimes: number;
  jaimeParMoi: boolean;
  commentaires: number;
  lienCommentaires: string;
}) {
  const [etat, basculer] = useOptimistic(
    { jaimes, jaimeParMoi },
    (courant) => ({
      jaimeParMoi: !courant.jaimeParMoi,
      jaimes: courant.jaimes + (courant.jaimeParMoi ? -1 : 1),
    }),
  );
  const [, demarrer] = useTransition();

  const aimer = () => {
    const fd = new FormData();
    fd.set("newsId", newsId);
    fd.set("space", space);
    demarrer(async () => {
      basculer(null);
      await basculerJaime(fd);
    });
  };

  const pastille =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.8px] font-semibold border transition-colors cursor-pointer no-underline";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={aimer}
        aria-pressed={etat.jaimeParMoi}
        aria-label={etat.jaimeParMoi ? "Je n’aime plus" : "J’aime"}
        className={`${pastille} ${
          etat.jaimeParMoi
            ? "bg-accent-soft border-accent/40 text-accent-strong"
            : "bg-transparent border-line text-muted hover:text-ink hover:border-faint"
        }`}
      >
        <ThumbsUp
          size={15}
          className={etat.jaimeParMoi ? "fill-current" : ""}
        />
        <span className="tabular-nums">{etat.jaimes}</span>
      </button>

      <Link
        href={lienCommentaires}
        aria-label={`${commentaires} commentaire${commentaires > 1 ? "s" : ""} — commenter`}
        className={`${pastille} bg-transparent border-line text-muted hover:text-ink hover:border-faint`}
      >
        <MessageSquare size={15} />
        <span className="tabular-nums">{commentaires}</span>
      </Link>
    </div>
  );
}
