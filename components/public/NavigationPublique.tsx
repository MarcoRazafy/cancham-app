"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LienAncre } from "@/components/public/LienAncre";

export interface LienNavigation {
  /** « / », « /#section » ou « /page ». */
  href: string;
  libelle: string;
  /**
   * Sur grand écran, ce lien vit ailleurs — en bouton, à côté de
   * « Se connecter » — et n'apparaît ici qu'en deçà, où deux boutons ne
   * tiennent pas sur la ligne.
   */
  mobileSeulement?: boolean;
}

/**
 * Sous l'en-tête, la hauteur en deçà de laquelle une section compte comme
 * « celle où l'on est » : son titre vient de passer sous la barre.
 */
const MARGE_SOUS_ENTETE = 40;

/**
 * Les liens de la barre de la vitrine, avec le repère de la page où l'on est.
 *
 * Un lien vers une page est marqué quand on y est, ou dans ce qu'elle
 * rassemble : « Événements » l'est aussi sur la fiche d'un événement. Un lien
 * vers une section de l'accueil l'est quand cette section est sous l'en-tête,
 * ce qui se mesure au défilement ; tant qu'aucune ne l'est, c'est « Accueil ».
 *
 * Le repère est posé par `aria-current="page"` : les lecteurs d'écran
 * l'annoncent, et le style s'y accroche (voir `lien` dans CadreVitrine.tsx).
 */
export function NavigationPublique({
  liens,
  className,
}: {
  liens: LienNavigation[];
  className: string;
}) {
  const chemin = usePathname();
  /**
   * La section de l'accueil sous l'en-tête, ou `null`. Mesurée sur l'accueil
   * seulement ; ailleurs, sa valeur ne compte pas (voir `actif`).
   */
  const [section, setSection] = useState<string | null>(null);

  useEffect(() => {
    const ancres = liens
      .filter((l) => l.href.startsWith("/#"))
      .map((l) => l.href.slice(2));
    if (chemin !== "/" || !ancres.length) return;

    let attente = false;
    const mesurer = () => {
      if (attente) return;
      attente = true;
      requestAnimationFrame(() => {
        attente = false;
        const seuil =
          (document.querySelector("header")?.getBoundingClientRect().bottom ??
            0) + MARGE_SOUS_ENTETE;
        // La plus basse des sections dont le haut est passé sous l'en-tête.
        let courante: string | null = null;
        let haut = -Infinity;
        for (const id of ancres) {
          const top = document.getElementById(id)?.getBoundingClientRect().top;
          if (top !== undefined && top <= seuil && top > haut) {
            courante = id;
            haut = top;
          }
        }
        setSection(courante);
      });
    };
    mesurer();
    window.addEventListener("scroll", mesurer, { passive: true });
    window.addEventListener("resize", mesurer);
    return () => {
      window.removeEventListener("scroll", mesurer);
      window.removeEventListener("resize", mesurer);
    };
  }, [chemin, liens]);

  const sectionCourante = chemin === "/" ? section : null;
  const actif = (href: string) => {
    const [page, ancre] = href.split("#");
    if (ancre) {
      return (
        (chemin === page && sectionCourante === ancre) ||
        chemin.startsWith(`/${ancre}/`)
      );
    }
    if (href === "/") return chemin === "/" && sectionCourante === null;
    return chemin === href || chemin.startsWith(`${href}/`);
  };

  return (
    <>
      {liens.map((l) => (
        <LienAncre
          key={l.href}
          href={l.href}
          className={`${className} ${l.mobileSeulement ? "xl:hidden" : ""}`}
          actif={actif(l.href)}
        >
          {l.libelle}
        </LienAncre>
      ))}
    </>
  );
}
