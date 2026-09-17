"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * Photos d'une publication : la première en grand, les suivantes en
 * vignettes, et une visionneuse plein écran qui passe de l'une à l'autre —
 * flèches à l'écran, flèches du clavier, vignettes en bas.
 */
export function GaleriePhotos({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const boite = useRef<HTMLDialogElement>(null);
  const [courante, setCourante] = useState<number | null>(null);
  const total = images.length;

  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    if (courante !== null && !el.open) el.showModal();
    if (courante === null && el.open) el.close();
  }, [courante]);

  const aller = useCallback(
    (sens: -1 | 1) =>
      setCourante((i) => (i === null ? i : (i + sens + total) % total)),
    [total],
  );

  useEffect(() => {
    if (courante === null) return;
    const touche = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") aller(-1);
      if (e.key === "ArrowRight") aller(1);
    };
    document.addEventListener("keydown", touche);
    return () => document.removeEventListener("keydown", touche);
  }, [courante, aller]);

  if (!total) return null;
  const [premiere, ...suivantes] = images;

  return (
    <>
      <button
        type="button"
        onClick={() => setCourante(0)}
        aria-label={`Agrandir la photo 1 sur ${total}`}
        className="group relative block w-full aspect-[16/8] rounded-[var(--radius-m)] overflow-hidden p-0 border-0 cursor-zoom-in bg-surface-2"
      >
        <Image
          src={premiere}
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 760px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        {total > 1 ? (
          <span className="absolute bottom-3 right-3 rounded-full bg-[#0f1d2c]/75 text-white text-[12px] font-semibold px-3 py-1">
            {total} photos
          </span>
        ) : null}
      </button>

      {suivantes.length ? (
        <div
          className={`grid gap-2 mt-2 ${
            suivantes.length >= 4
              ? "grid-cols-4"
              : suivantes.length === 3
                ? "grid-cols-3"
                : "grid-cols-2"
          }`}
        >
          {suivantes.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setCourante(i + 1)}
              aria-label={`Agrandir la photo ${i + 2} sur ${total}`}
              className="group relative aspect-[4/3] rounded-[var(--radius-s)] overflow-hidden p-0 border-0 cursor-zoom-in bg-surface-2"
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="200px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
            </button>
          ))}
        </div>
      ) : null}

      <dialog
        ref={boite}
        onClose={() => setCourante(null)}
        onClick={(e) => {
          if (e.target === boite.current) setCourante(null);
        }}
        aria-label="Photos de la publication"
        className="m-auto w-[min(1100px,94vw)] max-w-none bg-transparent p-0 border-0 backdrop:bg-[#0f1d2c]/85 backdrop:backdrop-blur-sm"
      >
        {courante !== null ? (
          <figure className="m-0">
            <div className="relative flex items-center justify-center">
              <Image
                key={images[courante]}
                src={images[courante]}
                alt={`${alt} — photo ${courante + 1} sur ${total}`}
                width={1600}
                height={1200}
                sizes="(max-width: 1100px) 94vw, 1100px"
                className="block w-auto h-auto max-w-full max-h-[74vh] rounded-[var(--radius-l)] shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setCourante(null)}
                aria-label="Fermer"
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#0f1d2c]/70 text-white flex items-center justify-center cursor-pointer border-0 hover:bg-[#0f1d2c]"
              >
                <X size={18} />
              </button>
              {total > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => aller(-1)}
                    aria-label="Photo précédente"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#0f1d2c]/70 text-white flex items-center justify-center cursor-pointer border-0 hover:bg-[#0f1d2c]"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() => aller(1)}
                    aria-label="Photo suivante"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#0f1d2c]/70 text-white flex items-center justify-center cursor-pointer border-0 hover:bg-[#0f1d2c]"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              ) : null}
            </div>

            {total > 1 ? (
              <figcaption className="mt-3 flex flex-col items-center gap-2.5">
                <span className="text-[13px] text-white/85 tabular-nums">
                  {courante + 1} / {total}
                </span>
                <span className="flex gap-2 overflow-x-auto max-w-full px-1 pb-1">
                  {images.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setCourante(i)}
                      aria-label={`Photo ${i + 1}`}
                      aria-current={i === courante}
                      className={`relative w-16 h-12 shrink-0 rounded-md overflow-hidden p-0 cursor-pointer border-2 ${
                        i === courante
                          ? "border-white"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </span>
              </figcaption>
            ) : null}
          </figure>
        ) : null}
      </dialog>
    </>
  );
}
