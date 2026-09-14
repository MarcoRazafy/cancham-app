"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Chiffre qui s'incrémente à l'affichage.
 *
 * La valeur finale est rendue côté serveur : sans JavaScript, ou si le visiteur
 * a demandé moins d'animations, le bon chiffre s'affiche directement — le
 * décompte est une bonification, jamais une condition de lecture.
 *
 * `null` signifie « pas encore animé » et fait afficher la valeur finale. Le
 * décompte ne démarre qu'à l'entrée dans la fenêtre, et sa première image pose
 * zéro : il n'y a donc aucune remise à zéro à écrire dans un effet.
 */
export function Compteur({
  valeur,
  duree = 1500,
}: {
  valeur: number;
  duree?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [anime, setAnime] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let image = 0;

    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (!entree.isIntersecting) return;
        observateur.disconnect();

        const depart = performance.now();
        const avancer = (maintenant: number) => {
          const t = Math.min(1, (maintenant - depart) / duree);
          // Amorti en fin de course : le chiffre ralentit en approchant sa valeur.
          const progression = 1 - Math.pow(1 - t, 3);
          setAnime(Math.round(valeur * progression));
          if (t < 1) image = requestAnimationFrame(avancer);
        };
        image = requestAnimationFrame(avancer);
      },
      { threshold: 0.4 },
    );

    observateur.observe(el);

    return () => {
      observateur.disconnect();
      cancelAnimationFrame(image);
    };
  }, [valeur, duree]);

  return (
    <span ref={ref} className="tabular-nums">
      {anime ?? valeur}
    </span>
  );
}
