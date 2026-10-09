"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

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
