"use client";

import { Printer } from "lucide-react";

/** Déclenche l'impression, donc l'export PDF du navigateur. */
export function PrintButton({
  contour = false,
}: {
  /** Bouton secondaire, quand une autre action occupe la place principale. */
  contour?: boolean;
}) {
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
