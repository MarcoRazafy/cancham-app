"use client";

import { useEffect, useRef } from "react";

export function DefilerEnBas({ repere }: { repere: string }) {
  const ancre = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    ancre.current?.scrollIntoView({ block: "end" });
  }, [repere]);
  return <span ref={ancre} aria-hidden className="block h-px shrink-0" />;
}
