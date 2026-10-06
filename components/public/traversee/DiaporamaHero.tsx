"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Fond du hero : un diaporama des rencontres CanCham.
 *
 * Toutes les `INTERVALLE_MS` millisecondes, la photo suivante apparaît en
 * fondu et commence un zoom avant lent ; la précédente s'efface. Le voile
 * bleu nuit du hero (globals.css, `.hero::before`) reste par-dessus, le
 * texte garde donc la même lisibilité quelle que soit la photo.
 *
 * Qui a demandé moins d'animations voit la première photo, immobile.
 */

const PHOTOS = [
  { src: "/traversee/hero.jpg", position: "50% 40%" },
  { src: "/traversee/salle.jpg", position: "50% 55%" },
  { src: "/traversee/public.jpg", position: "50% 35%" },
  { src: "/traversee/assistance.jpg", position: "50% 40%" },
  { src: "/traversee/groupe.jpg", position: "50% 30%" },
];

/** Durée d'affichage de chaque photo. */
const INTERVALLE_MS = 5000;

export function DiaporamaHero() {
  const [actif, setActif] = useState(0);

  useEffect(() => {
    // Moins d'animations demandées : la première photo reste seule. Le zoom
    // et le fondu sont déjà coupés par globals.css dans ce cas.
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
