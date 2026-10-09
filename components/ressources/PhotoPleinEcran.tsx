"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";

export function PhotoPleinEcran({
  src,
  legende,
}: {
  src: string;
  legende?: string;
}) {
  const boite = useRef<HTMLDialogElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const plein = useRef(false);
  const [ouvert, setOuvert] = useState(false);

  const ouvrir = () => {
    const el = boite.current;
    if (!el) return;
    setOuvert(true);
    if (!el.open) el.showModal();
    scene.current?.requestFullscreen?.().catch(() => {});
  };
  const fermer = () => boite.current?.close();

  useEffect(() => {
    const suivre = () => {
      if (document.fullscreenElement === scene.current) plein.current = true;
      else if (plein.current) {
        plein.current = false;
        boite.current?.close();
      }
    };
    document.addEventListener("fullscreenchange", suivre);
    return () => document.removeEventListener("fullscreenchange", suivre);
  }, []);

  return (
    <figure className="m-0">
      <button
        type="button"
        onClick={ouvrir}
        aria-label={`Afficher en plein écran${legende ? ` : ${legende}` : ""}`}
        className="group/photo relative block w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-m)] border-0 bg-transparent p-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={legende ?? ""}
          loading="lazy"
          draggable={false}
          className="block h-auto w-full"
        />
        <span className="pointer-events-none absolute inset-0 bg-[#0f1d2c]/0 transition-colors group-hover/photo:bg-[#0f1d2c]/12" />
        <span className="pointer-events-none absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#0f1d2c]/70 text-white opacity-0 transition-opacity group-hover/photo:opacity-100 group-focus-visible/photo:opacity-100">
          <Maximize2 size={15} />
        </span>
      </button>
      {legende ? (
        <figcaption className="mt-2 text-center text-[13px] text-muted">
          {legende}
        </figcaption>
      ) : null}

      <dialog
        ref={boite}
        onClose={() => {
          setOuvert(false);
          plein.current = false;
          if (document.fullscreenElement === scene.current) {
            void document.exitFullscreen().catch(() => {});
          }
        }}
        onClick={fermer}
        className="m-0 h-dvh max-h-none w-dvw max-w-none cursor-zoom-out select-none border-0 bg-black p-0 backdrop:bg-black"
      >
        <div
          ref={scene}
          className="relative h-full w-full select-none bg-black"
        >
          {ouvert ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={legende ?? ""}
                draggable={false}
                className="block h-full w-full select-none object-contain"
              />
              <button
                type="button"
                onClick={fermer}
                aria-label="Fermer"
                className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30"
              >
                <X size={20} />
              </button>
              {legende ? (
                <p className="pointer-events-none absolute inset-x-0 bottom-0 m-0 bg-gradient-to-t from-black/80 to-transparent px-6 pb-4 pt-10 text-center text-[14px] text-white">
                  {legende}
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </dialog>
    </figure>
  );
}
