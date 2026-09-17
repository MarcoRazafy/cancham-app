"use client";

import { useEffect } from "react";
import { markThreadRead } from "@/lib/actions/messages";
import type { Space } from "@/lib/types";

/**
 * Marque la conversation affichée comme lue.
 *
 * Depuis le navigateur, une fois la page affichée, plutôt que pendant le rendu
 * serveur : Next précharge les liens de la liste des fils, et un simple survol
 * marquerait alors comme lue une conversation jamais ouverte.
 */
export function MarquerLu({
  threadId,
  space,
  nonLus,
}: {
  threadId: string;
  space: Space;
  nonLus: number;
}) {
  useEffect(() => {
    if (nonLus > 0) markThreadRead(threadId, space);
  }, [threadId, space, nonLus]);
  return null;
}
