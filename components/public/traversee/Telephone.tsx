"use client";

import { useRef, type ReactNode } from "react";

const AMPLITUDE = 10;

export function Telephone({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const suivre = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const r = el.getBoundingClientRect();
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
