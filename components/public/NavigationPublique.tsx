"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LienAncre } from "@/components/public/LienAncre";

export interface LienNavigation {
  href: string;
  libelle: string;
  mobileSeulement?: boolean;
}

const MARGE_SOUS_ENTETE = 40;

export function NavigationPublique({
  liens,
  className,
}: {
  liens: LienNavigation[];
  className: string;
}) {
  const chemin = usePathname();
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
