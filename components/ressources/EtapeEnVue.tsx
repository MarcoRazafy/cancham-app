"use client";

import { useEffect, useRef } from "react";

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
