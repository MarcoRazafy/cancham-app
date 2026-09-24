import Image from "next/image";
import { Tag } from "lucide-react";
import { TITRE_GRAS } from "@/components/public/CadreVitrine";
import type { Offer } from "@/lib/types";

/**
 * Une offre entre membres, telle que la vitrine la montre.
 *
 * Sur la plateforme, la carte mène à la fiche de l'entreprise qui propose
 * l'avantage. Ici, il n'y a pas de fiche à ouvrir : l'annuaire est réservé
 * aux adhérents. La carte ne cherche donc pas à conduire quelque part — elle
 * montre ce qui se passe entre membres, et c'est le bouton de la section qui
 * propose d'en être.
 */
export function CarteOffre({ offre }: { offre: Offer }) {
  return (
    <article className="flex flex-col rounded-xl overflow-hidden bg-white shadow-[0_2px_14px_rgba(15,29,44,0.06)]">
      <div className="relative shrink-0 aspect-[16/9] overflow-hidden bg-[#e9edf2]">
        {offre.cover ? (
          <Image
            src={offre.cover}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-[#8797a6]"
          >
            <Tag size={28} />
          </div>
        )}
        <span className="absolute left-4 bottom-4 max-w-[calc(100%-32px)] truncate rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--marque-nuit)] shadow-[0_2px_10px_rgba(15,29,44,0.18)]">
          {offre.membre}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-5">
        <h3
          className={`${TITRE_GRAS} text-[17px] leading-[1.35] text-[var(--marque-nuit)] m-0 mb-2`}
        >
          {offre.titre}
        </h3>
        <p className="m-0 text-[13.5px] leading-[1.6] text-[#6b6b6b] line-clamp-3">
          {offre.desc}
        </p>
      </div>
    </article>
  );
}
