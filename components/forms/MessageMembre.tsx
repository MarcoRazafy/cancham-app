"use client";

import { MessageSquare } from "lucide-react";
import { SubmitButton } from "@/components/form-bits";
import { ouvrirConversation } from "@/lib/actions/messages";
import type { Space } from "@/lib/types";

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
