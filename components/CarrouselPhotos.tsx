"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Agrandir } from "@/components/Agrandir";

/**
 * Galerie d'un produit : une photo à la fois, les suivantes à portée de clic.
 *
 * Le défilement est natif — accrochage CSS, glissement au doigt, molette —
 * et fonctionne sans JavaScript. Les flèches et les pastilles ne sont posées
 * par-dessus qu'à partir de deux photos : sur une photo unique, elles
 * promettraient une suite qui n'existe pas.
 *
 * Pas d'avance automatique : on regarde un produit, on ne subit pas un
 * diaporama. Chaque photo s'ouvre en grand au clic.
 */
export function CarrouselPhotos({
  photos,
  alt,
  className = "",
}: {
  /** Au moins une photo : le cas vide se rend côté serveur, par un dégradé. */
  photos: string[];
  alt: string;
  /** Gabarit de la vignette, par exemple `aspect-[4/3] rounded-…`. */
  className?: string;
}) {
  const piste = useRef<HTMLDivElement>(null);
  const [courante, setCourante] = useState(0);
  const plusieurs = photos.length > 1;

  /** L'index affiché se relit sur la position réelle : doigt, molette ou flèche. */
  const mesurer = useCallback(() => {
    const el = piste.current;
    if (!el || el.clientWidth === 0) return;
    setCourante(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  useEffect(() => {
    const el = piste.current;
    if (!el || !plusieurs) return;
    el.addEventListener("scroll", mesurer, { passive: true });
    return () => el.removeEventListener("scroll", mesurer);
  }, [mesurer, plusieurs]);

  const allerA = (i: number) => {
    const el = piste.current;
    if (!el) return;
    const cible = (i + photos.length) % photos.length;
    el.scrollTo({ left: cible * el.clientWidth, behavior: "smooth" });
  };

  const fleche =
    "absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 text-ink shadow-md flex items-center justify-center cursor-pointer transition-opacity opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 hover:bg-white";

  return (
    <div className={`group relative overflow-hidden ${className}`}>
      <div
        ref={piste}
        className="flex h-full overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((src, i) => (
          <div
            key={src + i}
            className="relative h-full w-full shrink-0 snap-start"
          >
            <Agrandir
              src={src}
              alt={`${alt} — photo ${i + 1}`}
              legende={plusieurs ? `${alt} · ${i + 1}/${photos.length}` : alt}
              className="h-full"
            >
              <Image
                src={src}
                alt={`${alt} — photo ${i + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-cover"
              />
            </Agrandir>
          </div>
        ))}
      </div>

      {plusieurs ? (
        <>
          <button
            type="button"
            onClick={() => allerA(courante - 1)}
            aria-label="Photo précédente"
            className={`${fleche} left-2`}
          >
            <ChevronLeft size={17} />
          </button>
          <button
            type="button"
            onClick={() => allerA(courante + 1)}
            aria-label="Photo suivante"
            className={`${fleche} right-2`}
          >
            <ChevronRight size={17} />
          </button>

          <div className="absolute bottom-2 inset-x-0 z-10 flex justify-center gap-1.5 pointer-events-none">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => allerA(i)}
                aria-label={`Photo ${i + 1} sur ${photos.length}`}
                aria-current={i === courante}
                className={`pointer-events-auto h-1.5 rounded-full transition-all cursor-pointer shadow-sm ${
                  i === courante
                    ? "w-4 bg-white"
                    : "w-1.5 bg-white/55 hover:bg-white/80"
                }`}
              />
            ))}
          </div>

          <span className="absolute top-2 right-2 z-10 text-[10.5px] font-semibold tabular-nums text-white bg-[#0f1d2c]/60 rounded-full px-2 py-0.5 pointer-events-none">
            {courante + 1}/{photos.length}
          </span>
        </>
      ) : null}
    </div>
  );
}
