"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const PHOTOS = [
  { src: "/traversee/hero.jpg", position: "50% 40%" },
  { src: "/traversee/salle.jpg", position: "50% 55%" },
  { src: "/traversee/public.jpg", position: "50% 35%" },
  { src: "/traversee/assistance.jpg", position: "50% 40%" },
  { src: "/traversee/groupe.jpg", position: "50% 30%" },
];

const INTERVALLE_MS = 5000;

export function DiaporamaHero() {
  const [actif, setActif] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const horloge = window.setInterval(
      () => setActif((i) => (i + 1) % PHOTOS.length),
      INTERVALLE_MS,
    );
    return () => window.clearInterval(horloge);
  }, []);

  return (
    <div className="hero-photo diapo anime" aria-hidden="true">
      {PHOTOS.map((p, i) => (
        <Image
          key={p.src}
          src={p.src}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          className={`diapo-img ${i === actif ? "active" : ""}`}
          style={{ objectFit: "cover", objectPosition: p.position }}
        />
      ))}
    </div>
  );
}
