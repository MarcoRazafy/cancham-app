"use client";

import { useEffect, useRef } from "react";

/**
 * Amène l'étape en cours au milieu de la liste des étapes.
 *
 * Dans un long dossier, la liste défile dans son cadre : sans cela, on
 * ouvrirait la douzième étape devant une liste arrêtée sur les premières.
 * Seule la liste bouge — la page, elle, reste où elle est.
 */
export function EtapeEnVue() {
  const repere = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const etape = repere.current?.closest("li");
    const liste = etape?.closest("ol");
    if (!etape || !liste) return;
    liste.scrollTop =
      etape.offsetTop - (liste.clientHeight - etape.clientHeight) / 2;
  }, []);
  return <span ref={repere} hidden />;
}
