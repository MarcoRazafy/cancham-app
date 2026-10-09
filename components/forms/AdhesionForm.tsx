"use client";

import { SubmitButton } from "@/components/form-bits";

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
