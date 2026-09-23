import Image from "next/image";
import { TITRE_GRAS } from "@/components/public/CadreVitrine";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { fmtDate } from "@/lib/format";
import type { ActualitePublique } from "@/lib/queries";

/**
 * Une actualité sur la page publique : sa photo de couverture, sa catégorie,
 * sa date, son titre et son résumé. Toute la carte mène à l'article.
 */
export function CarteActualite({
  actualite: a,
}: {
  actualite: ActualitePublique;
}) {
  const couverture = a.images[0];
  return (
    <Link
      href={`/public/actualites/${a.id}`}
      className="group flex flex-col no-underline rounded-xl overflow-hidden bg-surface border border-line shadow-[var(--shadow)] transition-[border-color,box-shadow] hover:border-faint hover:shadow-[0_18px_40px_-22px_rgb(0_0_0/0.6)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-3">
        {couverture ? (
          <Image
            src={couverture}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-white/70"
            style={{
              background:
                "linear-gradient(135deg, var(--marque-nuit-2), var(--marque-nuit-3))",
            }}
          >
            <Newspaper size={34} />
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="surtitre text-marque-vert">{a.cat}</span>
          <span className="text-[12.5px] text-faint">· {fmtDate(a.date)}</span>
        </div>
        <h3
          className={`${TITRE_GRAS} text-[19px] leading-snug m-0 mt-2 text-ink`}
        >
          {a.titre}
        </h3>
        <p className="m-0 mt-2 text-[14px] text-muted leading-relaxed line-clamp-3 flex-1">
          {a.extrait}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-marque-vert">
          Lire l’article{" "}
          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
