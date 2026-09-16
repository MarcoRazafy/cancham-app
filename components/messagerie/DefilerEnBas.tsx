"use client";

import { useEffect, useRef } from "react";

/**
 * Amène la conversation à son dernier message.
 *
 * Posé à la fin de la liste : à l'ouverture d'un fil et après chaque envoi,
 * on lit le plus récent sans avoir à faire défiler — sauf si l'on arrive par
 * une recherche, qui vise un message précis.
 */
export function DefilerEnBas({ repere }: { repere: string }) {
  const ancre = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    ancre.current?.scrollIntoView({ block: "end" });
  }, [repere]);
  return <span ref={ancre} aria-hidden className="block h-px shrink-0" />;
}
