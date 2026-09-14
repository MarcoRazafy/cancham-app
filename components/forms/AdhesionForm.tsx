"use client";

import { SubmitButton } from "@/components/form-bits";

/** Bouton d'envoi du formulaire public, avec état d'attente. */
export function SubmitAdhesionButton() {
  return (
    <SubmitButton
      pendingLabel="Envoi de la demande…"
      className="w-full justify-center py-[11px]"
    >
      Envoyer ma demande d’adhésion
    </SubmitButton>
  );
}
