import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { parseISO } from "@/lib/format";
import { visuelEvenement } from "@/lib/images-publiques";
import type { CanchamEvent } from "@/lib/types";

/** Catégorie déduite du titre, à défaut d'un champ dédié dans le modèle. */
function categorie(e: CanchamEvent): string {
  const t = e.titre.toLowerCase();
  if (t.includes("5 à 7")) return "Réseautage";
  if (t.includes("mecc") || t.includes("mission")) return "Mission économique";
  if (t.includes("expo") || t.includes("caravane")) return "Rencontre";
  if (e.format === "Webinaire") return "Atelier en ligne";
  return "Événement";
}

export function CarteEvenement({
  evenement,
  index,
}: {
  evenement: CanchamEvent;
  index: number;
}) {
  const d = parseISO(evenement.date);
  const jour = d.getDate();
  const mois = d
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  const visuel = visuelEvenement(evenement.id, index);

  return (
    <Link
      href={`/public/evenements/${evenement.id}`}
      className="group block no-underline rounded-xl overflow-hidden bg-white/[0.03] border border-white/10 transition-colors hover:border-white/25"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--marque-nuit-2)]">
        {visuel ? (
          <Image
            src={visuel.url}
            alt={visuel.alt}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : null}
        <div className="absolute inset-0 bg-linear-to-t from-[var(--marque-nuit)]/85 to-transparent" />
      </div>

      <div className="p-5">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="font-[family-name:var(--font-titre)] text-[11.5px] font-bold px-2.5 py-1 rounded-md bg-marque-rouge text-white tracking-wide">
            {jour} {mois}
          </span>
          <span className="surtitre text-white/50">{categorie(evenement)}</span>
        </div>

        <h3 className="titre text-[19px] font-bold m-0 mb-2.5 text-white">
          {evenement.titre}
        </h3>

        <div className="flex items-center gap-1.5 text-[13px] text-white/60 mb-4">
          <MapPin size={14} />
          {evenement.lieu}
        </div>

        <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-marque-vert">
          Découvrir
          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  );
}
