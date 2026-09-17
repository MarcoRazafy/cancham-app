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
 *
 * Une conversation prise par défaut, faute de choix dans l'adresse, n'est
 * affichée que sur grand écran : sur téléphone, la liste est seule à l'écran,
 * et rien n'a été lu.
 */
export function MarquerLu({
  threadId,
  space,
  nonLus,
  choixExplicite,
}: {
  threadId: string;
  space: Space;
  nonLus: number;
  choixExplicite: boolean;
}) {
  useEffect(() => {
    if (nonLus === 0) return;
    if (!choixExplicite && !window.matchMedia("(min-width: 768px)").matches)
      return;
    markThreadRead(threadId, space);
  }, [threadId, space, nonLus, choixExplicite]);
  return null;
}
