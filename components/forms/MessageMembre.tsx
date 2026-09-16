"use client";

import { MessageSquare } from "lucide-react";
import { SubmitButton } from "@/components/form-bits";
import { ouvrirConversation } from "@/lib/actions/messages";
import type { Space } from "@/lib/types";

/**
 * Ouvre la conversation avec une entreprise depuis sa fiche.
 *
 * Un formulaire, pas un lien : l'action doit pouvoir créer le fil avant de
 * rediriger, et le bouton se désactive pendant ce temps — deux clics rapides
 * créeraient deux fils avant que le garde-fou serveur n'ait vu le premier.
 */
export function BoutonMessage({
  memberId,
  space = "membre",
}: {
  memberId: string;
  space?: Space;
}) {
  return (
    <form action={ouvrirConversation}>
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="space" value={space} />
      <SubmitButton pendingLabel="Ouverture…">
        <MessageSquare size={14} /> Envoyer un message
      </SubmitButton>
    </form>
  );
}
