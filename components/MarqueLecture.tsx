"use client";

import { useEffect } from "react";
import { marquerRessourceLue } from "@/lib/actions/content";

/**
 * Note qu'une ressource a été ouverte, une fois sa page affichée.
 *
 * Depuis le navigateur, et non pendant le rendu de la page : une page
 * préchargée au survol d'un lien n'a pas été lue pour autant.
 */
export function MarqueLecture({ id }: { id: string }) {
  useEffect(() => {
    void marquerRessourceLue(id);
  }, [id]);
  return null;
}
