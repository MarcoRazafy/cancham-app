"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";

/**
 * Bouton d'envoi aux couleurs de la charte.
 *
 * Il se désactive pendant le traitement : sans cela, un double-clic déposerait
 * deux candidatures.
 */
export function BoutonEnvoi({
  children,
  enCours,
  pleineLargeur = true,
}: {
  children: React.ReactNode;
  enCours: string;
  /** Faux dans une rangée de boutons : le bouton prend alors sa largeur. */
  pleineLargeur?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`btn-action ${pleineLargeur ? "w-full" : ""} whitespace-normal text-center leading-snug px-4 sm:px-[26px]`}
    >
      {pending ? (
        <LoaderCircle size={17} aria-hidden className="animate-spin shrink-0" />
      ) : null}
      {pending ? enCours : children}
      {pending ? null : <ArrowRight size={17} className="shrink-0" />}
    </button>
  );
}

/**
 * Bouton en pilule de l'accueil pas à pas (« Suivant », « Terminer ») : vert
 * de la charte, comme la barre de progression qu'il fait avancer.
 */
export function BoutonPilule({
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
      className="inline-flex items-center gap-2 rounded-full bg-marque-vert text-white text-[15px] font-semibold px-7 py-2.5 border-0 cursor-pointer transition-[background-color,transform] hover:bg-[#005c33] active:translate-y-px active:scale-[0.98] disabled:opacity-70 disabled:cursor-default"
    >
      {pending ? (
        <LoaderCircle size={16} aria-hidden className="animate-spin shrink-0" />
      ) : null}
      {pending ? enCours : children}
    </button>
  );
}
