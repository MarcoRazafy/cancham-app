"use client";

import { Send } from "lucide-react";
import { INPUT, SubmitButton } from "@/components/form-bits";
import { sendMessage } from "@/lib/actions/messages";
import type { Space } from "@/lib/types";

/**
 * Zone de saisie d'un fil de discussion.
 *
 * L'action serveur est passée directement au formulaire — et non enveloppée
 * dans une closure — pour que l'envoi fonctionne aussi sans JavaScript. Le
 * champ se vide de lui-même : l'action redirige, et la page est re-rendue.
 */
export function MessageComposer({
  threadId,
  space,
}: {
  threadId: string;
  space: Space;
}) {
  return (
    <form
      action={sendMessage}
      className="flex gap-2 px-3.5 py-3 border-t border-line shrink-0"
    >
      <input type="hidden" name="threadId" value={threadId} />
      <input type="hidden" name="space" value={space} />
      <input
        type="text"
        name="texte"
        required
        autoComplete="off"
        placeholder="Écrire un message…"
        className={`${INPUT} flex-1`}
      />
      <SubmitButton sm pendingLabel="…" aria-label="Envoyer">
        <Send size={14} />
      </SubmitButton>
    </form>
  );
}
