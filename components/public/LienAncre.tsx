"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

/**
 * Un lien vers une section de la vitrine.
 *
 * Deux choses que le lien ordinaire ne fait pas. D'abord il glisse : on voit
 * où l'on va, au lieu d'être posé ailleurs sans transition. Ensuite il
 * fonctionne deux fois de suite — le routeur tient une adresse déjà courante
 * pour un non-événement, si bien qu'après être remonté, un second clic sur le
 * même lien ne redescendait plus.
 *
 * Depuis une autre page, il redevient un lien comme les autres : c'est le
 * chargement de la page qui amène à la bonne section.
 */
export function LienAncre({
  href,
  className,
  children,
}: {
  /** « #section » sur la page même, ou « /public#section » depuis ailleurs. */
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const chemin = usePathname();
  const [page, ancre] = href.split("#");
  const surPlace = !!ancre && (page === "" || page === chemin);

  const cliquer = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!surPlace || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const cible = document.getElementById(ancre);
    if (!cible) return;
    e.preventDefault();
    cible.scrollIntoView({
      // `block: "start"` respecte la marge de défilement des sections, qui
      // les arrête sous l'en-tête plutôt que dessous.
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    // L'adresse suit, sans ajouter une étape au bouton « Précédent ».
    history.replaceState(null, "", `#${ancre}`);
  };

  return (
    <Link href={href} className={className} onClick={cliquer}>
      {children}
    </Link>
  );
}
