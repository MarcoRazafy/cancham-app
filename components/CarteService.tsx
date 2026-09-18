"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ImageIcon, X } from "lucide-react";
import type { Produit } from "@/lib/types";
import { TexteLie } from "@/components/TexteLie";

/**
 * Carte d'une offre du catalogue, et sa fiche de détail.
 *
 * La carte ne montre que l'essentiel — vignette, nature, titre, prix. Un clic
 * ouvre la fiche : toutes les photos, la description complète, et, sur
 * « Mon entreprise », les commandes de modification.
 *
 * La fiche est un `<dialog>` natif : Échap, piège à focus et fond inerte sont
 * fournis par le navigateur.
 */
export function CarteService({
  produit,
  seed,
  actions,
}: {
  produit: Produit;
  /** Graine du dégradé de repli, pour qu'une offre sans photo garde sa couleur. */
  seed: string;
  /** Commandes affichées au pied de la fiche. Absentes = lecture seule. */
  actions?: ReactNode;
}) {
  const boite = useRef<HTMLDialogElement>(null);
  const [ouverte, setOuverte] = useState(false);
  const [courante, setCourante] = useState(0);

  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    if (ouverte && !el.open) el.showModal();
    if (!ouverte && el.open) el.close();
  }, [ouverte]);

  const photos = produit.photos;
  const vignette = photos[0];
  const nature = produit.type === "produit" ? "Produit" : "Service";

  const ouvrir = () => {
    setCourante(0);
    setOuverte(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={ouvrir}
        aria-haspopup="dialog"
        className="group w-full text-left cursor-pointer p-4 rounded-[var(--radius-l)] border border-line bg-surface shadow-[var(--shadow)] transition-shadow hover:shadow-[0_12px_28px_-20px_rgba(15,29,44,0.45)] focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="relative block aspect-[4/3] mb-3 rounded-[var(--radius-m)] overflow-hidden">
          {vignette ? (
            <Image
              src={vignette}
              alt={produit.label}
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <Degrade seed={seed} />
          )}
          {photos.length > 1 ? (
            <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10.5px] font-semibold text-white bg-[#0f1d2c]/65 rounded-full px-2 py-0.5">
              <ImageIcon size={11} /> {photos.length}
            </span>
          ) : null}
        </span>

        <span className="block text-[10.5px] font-bold uppercase tracking-[0.08em] text-accent">
          {nature}
        </span>
        <span className="block font-semibold text-[14px] text-ink mt-0.5 line-clamp-2">
          {produit.label}
        </span>
        {produit.prix ? (
          <span className="block text-[12.8px] text-muted mt-1">
            {produit.prix}
          </span>
        ) : null}
        <span className="block text-[12.4px] font-semibold text-accent mt-2 group-hover:underline">
          Voir le détail
        </span>
      </button>

      <dialog
        ref={boite}
        onClose={() => setOuverte(false)}
        onClick={(e) => {
          if (e.target === boite.current) setOuverte(false);
        }}
        aria-label={produit.label}
        className="m-auto w-[min(1080px,95vw)] max-h-[92vh] p-0 rounded-[var(--radius-l)] border-0 bg-surface text-ink shadow-2xl backdrop:bg-[#0f1d2c]/70 backdrop:backdrop-blur-sm"
      >
        {ouverte ? (
          <div className="grid md:grid-cols-[1.25fr_1fr]">
            {/* ---------- Galerie ---------- */}
            <div className="bg-surface-2 p-5 flex flex-col gap-3">
              <div className="relative aspect-[4/3] rounded-[var(--radius-m)] overflow-hidden">
                {photos[courante] ? (
                  <Image
                    src={photos[courante]}
                    alt={`${produit.label} — photo ${courante + 1}`}
                    fill
                    sizes="(max-width: 768px) 95vw, 620px"
                    className="object-cover"
                  />
                ) : (
                  <Degrade seed={seed} />
                )}
              </div>

              {photos.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photos.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setCourante(i)}
                      aria-label={`Photo ${i + 1} sur ${photos.length}`}
                      aria-current={i === courante}
                      className={`relative w-20 h-[60px] shrink-0 rounded-md overflow-hidden cursor-pointer p-0 border-2 transition-colors ${
                        i === courante
                          ? "border-accent"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* ---------- Détail ---------- */}
            <div className="p-7 md:p-8 flex flex-col min-h-0">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-accent">
                  {nature}
                </span>
                <button
                  type="button"
                  onClick={() => setOuverte(false)}
                  aria-label="Fermer"
                  className="w-8 h-8 -mt-1 -mr-1 rounded-full flex items-center justify-center text-muted cursor-pointer hover:bg-surface-2 hover:text-ink shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <h3 className="m-0 mt-1.5 text-[25px] leading-snug">
                {produit.label}
              </h3>

              {produit.prix ? (
                <div className="mt-2 text-[16.5px] font-semibold text-accent-strong">
                  {produit.prix}
                </div>
              ) : null}

              <div className="mt-5 text-[15px] leading-relaxed text-muted overflow-y-auto flex-1">
                {produit.description ? (
                  produit.description.split("\n\n").map((para, i) => (
                    <p key={i} className="m-0 mb-3 last:mb-0">
                      <TexteLie texte={para} />
                    </p>
                  ))
                ) : (
                  <p className="m-0 italic">
                    Aucune description pour le moment.
                  </p>
                )}
              </div>

              {actions ? (
                <div className="flex gap-2 flex-wrap mt-5 pt-4 border-t border-line">
                  {actions}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}

/** Dégradé de repli, stable pour une même graine — même logique que `PhotoPlaceholder`. */
function Degrade({ seed }: { seed: string }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const fond =
    h % 2 === 0
      ? "linear-gradient(135deg, var(--accent-strong), var(--accent))"
      : "linear-gradient(135deg, var(--navy), var(--navy-2))";
  return (
    <span
      className="absolute inset-0 flex items-center justify-center text-white/90"
      style={{ background: fond }}
    >
      <ImageIcon size={22} />
    </span>
  );
}
