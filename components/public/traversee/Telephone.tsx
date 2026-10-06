"use client";

import { useRef, type ReactNode } from "react";

/**
 * Le téléphone de la section Application, qui réagit à la souris.
 *
 * Quand le curseur le survole, l'appareil s'incline vers lui, en relief
 * (rotation sur deux axes), et un reflet suit le curseur sur l'écran. À la
 * sortie, il revient à plat en douceur. La lévitation lente vit sur le cadre
 * extérieur (`.telephone-cadre`), l'inclinaison sur le téléphone lui-même :
 * les deux mouvements ne se gênent pas.
 *
 * Inclinaison maximale : `AMPLITUDE` degrés. Sans souris (écran tactile) ou
 * si moins d'animations sont demandées, rien ne bouge au survol.
 */
const AMPLITUDE = 10;

export function Telephone({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const suivre = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const r = el.getBoundingClientRect();
    // Position du curseur dans le téléphone, de -0,5 à 0,5 sur chaque axe.
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(x * AMPLITUDE * 2).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-y * AMPLITUDE * 2).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
    el.classList.add("suivi");
  };

  const relacher = () => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("suivi");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div className="telephone-cadre" aria-hidden="true">
      <div
        ref={ref}
        className="telephone"
        onMouseMove={suivre}
        onMouseLeave={relacher}
      >
        {children}
      </div>
    </div>
  );
}
