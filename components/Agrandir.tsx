"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Rend une image cliquable : elle s'ouvre en grand dans une boîte modale.
 *
 * On s'en sert là où l'image ne mène nulle part — une photo de produit, une
 * couverture de fiche, le bandeau d'un événement dont on consulte déjà la
 * page. Partout ailleurs, l'image est un lien vers la ressource qu'elle
 * représente, ce qui vaut toujours mieux qu'un agrandissement.
 *
 * La boîte est un `<dialog>` natif : la touche Échap, le piège à focus et le
 * fond inerte sont fournis par le navigateur, sans une ligne de JavaScript.
 */
export function Agrandir({
  src,
  alt,
  legende,
  className = "",
  children,
}: {
  /** Image à afficher en grand. Sans elle, l'enfant n'est pas cliquable. */
  src?: string | null;
  alt: string;
  /** Texte affiché sous l'image agrandie. */
  legende?: string;
  /** Habillage du bouton, pour qu'il épouse la vignette. */
  className?: string;
  children: ReactNode;
}) {
  const boite = useRef<HTMLDialogElement>(null);
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    if (ouvert && !el.open) el.showModal();
    if (!ouvert && el.open) el.close();
  }, [ouvert]);

  if (!src) return <>{children}</>;

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label={`Agrandir : ${alt}`}
        className={`group relative block w-full text-left cursor-zoom-in p-0 border-0 bg-transparent ${className}`}
      >
        {children}
        {/* Un voile discret au survol : il dit que l'image répond au clic. */}
        <span className="absolute inset-0 bg-[#0f1d2c]/0 group-hover:bg-[#0f1d2c]/15 transition-colors pointer-events-none" />
      </button>

      <dialog
        ref={boite}
        onClose={() => setOuvert(false)}
        onClick={(e) => {
          // Un clic hors de l'image referme : la cible est alors le dialogue.
          if (e.target === boite.current) setOuvert(false);
        }}
        className="m-auto max-w-[min(1100px,92vw)] w-auto bg-transparent p-0 border-0 backdrop:bg-[#0f1d2c]/80 backdrop:backdrop-blur-sm"
      >
        {ouvert ? (
          <figure className="m-0 relative">
            <Image
              src={src}
              alt={alt}
              width={1600}
              height={1200}
              sizes="(max-width: 1100px) 92vw, 1100px"
              className="block w-auto h-auto max-w-full max-h-[80vh] rounded-[var(--radius-l)] shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setOuvert(false)}
              aria-label="Fermer"
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#0f1d2c]/70 text-white flex items-center justify-center cursor-pointer transition-colors hover:bg-[#0f1d2c]"
            >
              <X size={18} />
            </button>
            {legende ? (
              <figcaption className="mt-3 text-center text-[13px] text-white/85">
                {legende}
              </figcaption>
            ) : null}
          </figure>
        ) : null}
      </dialog>
    </>
  );
}
