"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Déclenche les apparitions au défilement de la vitrine.
 *
 * Une « scène » est un bloc de page portant la classe `scene` ; ses éléments
 * `reveler` attendent, cachés, qu'elle entre dans la fenêtre (`vitrine.css`).
 * Elle y entre, elle reçoit `data-visible`, la feuille lance ses animations,
 * et l'observateur la lâche : une scène ne se rejoue pas, et qui remonte la
 * page la retrouve telle qu'il l'a laissée.
 *
 * Le seuil est à zéro, exprès : un bloc haut — la grille du Conseil — ne
 * remplirait jamais un cinquième d'un écran de téléphone, et resterait caché.
 * La marge basse retient l'entrée jusqu'à ce que le bloc ait franchi le bord
 * d'un dixième d'écran, pour qu'elle se voie.
 *
 * Réexécuté à chaque changement de page : la vitrine navigue sans recharger,
 * et les scènes de la page suivante sont à observer à leur tour.
 *
 * Rien ici ne conditionne la lecture : sans JavaScript, ou si le visiteur a
 * demandé moins d'animations, la feuille affiche tout d'emblée.
 */
export function Scenes() {
  const chemin = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-visible", "");
          observateur.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );

    document
      .querySelectorAll(".scene:not([data-visible])")
      .forEach((scene) => observateur.observe(scene));

    return () => observateur.disconnect();
  }, [chemin]);

  return null;
}
