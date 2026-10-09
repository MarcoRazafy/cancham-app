"use client";

import { useEffect, useRef, useState } from "react";

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
