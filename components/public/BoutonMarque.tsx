"use client";

import { createPortal, useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { LogoOfficiel } from "@/components/public/Marque";

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

/**
 * Écran de passage, le temps d'entrer dans son espace.
 *
 * Après « Se connecter » ou « Créer mon compte », le serveur prépare
 * l'espace — tableau de bord, notifications, messagerie — avant de
 * l'envoyer : une à deux secondes pendant lesquelles le formulaire restait
 * figé, seul le bouton disant qu'il se passait quelque chose. L'écran de
 * passage prend alors toute la place : le logo, une barre qui avance, et ce
 * qui est en train de se faire. L'espace arrive ensuite en fondu.
 *
 * Il n'apparaît qu'au bout de 0,4 s : un mot de passe refusé revient plus
 * vite que ça, et l'écran ne clignote pas pour rien.
 *
 * À placer dans le formulaire : il suit son état d'envoi. Il est rendu
 * directement dans `<body>` : la carte du formulaire est animée, et une
 * transformation ferait d'elle le repère de l'écran « fixe », qui ne
 * couvrirait plus que la carte.
 */
export function EcranPassage({
  message,
  detail,
}: {
  message: string;
  detail: string;
}) {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="ecran-passage fixed inset-0 z-[300] flex flex-col items-center justify-center gap-6 bg-white px-6 text-center"
    >
      <LogoOfficiel className="w-[220px] h-auto ecran-passage-logo" priority />
      <div
        aria-hidden
        className="relative w-[200px] h-1 rounded-full bg-line overflow-hidden"
      >
        <span className="barre-passage absolute inset-0 rounded-full" />
      </div>
      <div>
        <p className="m-0 text-[17px] font-semibold text-ink">{message}</p>
        <p className="m-0 mt-1 text-[14px] text-muted">{detail}</p>
      </div>
    </div>,
    document.body,
  );
}
