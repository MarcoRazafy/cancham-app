"use client";

import { useState } from "react";

const SEUIL = 150;

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
          className="relative z-10 cursor-pointer border-0 bg-transparent p-0 text-[12.4px] font-semibold text-accent hover:underline"
        >
          {ouvert ? "voir moins" : "voir plus"}
        </button>
      ) : null}
    </div>
  );
}
