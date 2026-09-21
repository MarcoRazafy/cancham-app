import { ViewTransition, type ReactNode } from "react";

/**
 * Élément partagé entre deux pages : l'image d'un événement, le logo d'un
 * membre. Sur la liste et sur la fiche, il porte le même nom ; au clic, le
 * navigateur le fait voyager de sa place dans la carte à sa place dans la
 * fiche, au lieu de le faire disparaître d'un côté et surgir de l'autre. On
 * voit que c'est le même objet.
 *
 * `default="none"` : l'élément ne s'anime pas lors des autres transitions de
 * la page. Le voyage n'a lieu que si la fiche est prête au moment du clic —
 * préchargée (voir `prefetch` sur les cartes) ; sinon la fiche arrive
 * normalement, par son squelette.
 */
export function Partage({
  nom,
  children,
}: {
  nom: string;
  children: ReactNode;
}) {
  return (
    <ViewTransition name={nom} share="partage" default="none">
      {children}
    </ViewTransition>
  );
}
