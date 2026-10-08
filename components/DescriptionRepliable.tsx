"use client";

import { useState } from "react";

/** Au-delà, le texte est replié sur deux lignes, avec de quoi le déplier. */
const SEUIL = 150;

/**
 * La description d'une ressource dans une liste : deux lignes, et « voir
 * plus » quand elle en demande davantage.
 */
export function DescriptionRepliable({ texte }: { texte: string }) {
  const [ouvert, setOuvert] = useState(false);
  const long = texte.length > SEUIL;
  return (
    <div className="mt-1 text-[12.8px] leading-relaxed text-muted">
      <p
        className={`m-0 ${ouvert || !long ? "whitespace-pre-line" : "line-clamp-2"}`}
      >
        {texte}
      </p>
      {long ? (
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          aria-expanded={ouvert}
          // Au-dessus du lien qui couvre toute la ligne.
          className="relative z-10 cursor-pointer border-0 bg-transparent p-0 text-[12.4px] font-semibold text-accent hover:underline"
        >
          {ouvert ? "voir moins" : "voir plus"}
        </button>
      ) : null}
    </div>
  );
}
