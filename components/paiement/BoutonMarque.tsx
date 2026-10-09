"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

export function BoutonMarque({
  children,
  enCours = "Un instant…",
  className = "",
}: {
  children: ReactNode;
  enCours?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 border-0 bg-[var(--pf-bouton)] px-6 text-[15px] font-bold text-[var(--pf-sur-bouton)] transition-colors duration-200 hover:bg-[var(--pf-bouton-survol)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--pf-sur-bouton)] disabled:cursor-wait disabled:opacity-60 ${className}`}
    >
      {pending ? (
        <>
          <LoaderCircle size={16} aria-hidden className="animate-spin" />
          {enCours}
        </>
      ) : (
        children
      )}
    </button>
  );
}
