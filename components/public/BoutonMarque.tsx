"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";

/**
 * Bouton d'envoi aux couleurs de la charte.
 *
 * Il se désactive pendant le traitement : sans cela, un double-clic déposerait
 * deux candidatures.
 */
export function BoutonEnvoi({
  children,
  enCours,
}: {
  children: React.ReactNode;
  enCours: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-2.5 font-[family-name:var(--font-titre)] font-bold text-[14.5px] px-6 py-3.5 rounded-lg bg-marque-rouge text-white cursor-pointer border-0 transition-colors hover:bg-[#c00d0d] disabled:opacity-60 disabled:cursor-wait"
    >
      {pending ? enCours : children}
      {pending ? null : <ArrowRight size={17} />}
    </button>
  );
}
