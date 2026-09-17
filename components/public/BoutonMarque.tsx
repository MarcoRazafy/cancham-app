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
      className="btn-action w-full whitespace-normal text-center leading-snug px-4 sm:px-[26px]"
    >
      {pending ? enCours : children}
      {pending ? null : <ArrowRight size={17} className="shrink-0" />}
    </button>
  );
}
