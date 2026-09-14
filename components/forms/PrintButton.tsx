"use client";

import { Printer } from "lucide-react";

/** Déclenche l'impression, donc l'export PDF du navigateur. */
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-[7px] rounded-[var(--radius-s)] font-semibold cursor-pointer border border-transparent bg-accent text-white hover:bg-accent-strong text-[13.4px] px-[15px] py-[9px]"
    >
      <Printer size={15} /> Imprimer / Exporter PDF
    </button>
  );
}
