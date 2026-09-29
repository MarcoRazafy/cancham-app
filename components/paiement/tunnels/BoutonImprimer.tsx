"use client";

import { Printer } from "lucide-react";

/**
 * Imprimer le bordereau ou le bon : la coquille de l'espace membre et le
 * reste de l'écran portent `print:hidden`, seul le document part à
 * l'imprimante.
 */
export function BoutonImprimer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 border-0 bg-transparent px-2 text-[14px] font-semibold underline underline-offset-4 ${className}`}
    >
      <Printer size={16} aria-hidden /> {children}
    </button>
  );
}
