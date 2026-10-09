"use client";

import { Printer } from "lucide-react";

export function PrintButton({ contour = false }: { contour?: boolean }) {
  return (
    <button
      onClick={() => window.print()}
      className={
        contour
          ? "btn-contour btn-contour-sm text-ink hover:bg-surface-2"
          : "btn-action btn-action-sm"
      }
    >
      <Printer size={15} /> Imprimer / Exporter PDF
    </button>
  );
}
