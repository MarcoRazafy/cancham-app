"use client";

import { useEffect } from "react";
import { EVENEMENT } from "@/lib/traversee";

/**
 * Tout ce qui bouge sur la page, en un seul composant client.
 *
 * Le reste de la page est rendu côté serveur et reste lisible sans
 * JavaScript : ce composant ne fait qu'ajouter du mouvement par-dessus.
 *
 * - `[data-cd]`        : chiffres du compte à rebours, mis à jour chaque seconde ;
 * - `.scene`           : c'est `Scenes`, dans la mise en page de la vitrine, qui
 *                        pose `data-visible` sur chaque scène entrant dans la
 *                        fenêtre — rien à faire ici ;
 * - `[data-compteur]`  : nombre qui monte de zéro à sa valeur quand on l'atteint ;
 * - `.traversee`       : la ligne qui se dessine au fil du défilement ;
 * - `#flottante`       : la barre de réservation, visible une fois le hero passé.
 *
 * Qui a demandé moins d'animations voit les valeurs finales directement.
 */
export function Mouvement() {
  useEffect(() => {
    const reduit = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    /* ---------- Compte à rebours ---------- */
    const cible = new Date(EVENEMENT.dateGala).getTime();
    const tic = () => {
      const d = Math.max(0, cible - Date.now());
      const v: Record<string, number> = {
        j: Math.floor(d / 864e5),
        h: Math.floor(d / 36e5) % 24,
        m: Math.floor(d / 6e4) % 60,
        s: Math.floor(d / 1e3) % 60,
      };
      document.querySelectorAll<HTMLElement>("[data-cd]").forEach((el) => {
        const k = el.dataset.cd ?? "s";
        const txt = k === "j" ? String(v[k]) : String(v[k]).padStart(2, "0");
        if (el.textContent === txt) return;
        el.textContent = txt;
        if (!reduit && el.tagName === "B") {
          el.classList.remove("tic");
          void el.offsetWidth;
          el.classList.add("tic");
        }
      });
    };
    tic();
    const horloge = window.setInterval(tic, 1000);

    /* ---------- Compteurs ---------- */
    const compter = (el: HTMLElement) => {
      const fin = Number(el.dataset.compteur);
      if (reduit) {
        el.textContent = String(fin);
        return;
      }
      let t0: number | null = null;
      const pas = (ts: number) => {
        if (t0 === null) t0 = ts;
        const p = Math.min(1, (ts - t0) / 1500);
        el.textContent = String(Math.round(fin * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(pas);
      };
      requestAnimationFrame(pas);
    };
    const compteurs = document.querySelectorAll<HTMLElement>("[data-compteur]");
    let ioCompteurs: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      ioCompteurs = new IntersectionObserver(
        (entrees) => {
          entrees.forEach((e) => {
            if (!e.isIntersecting) return;
            compter(e.target as HTMLElement);
            ioCompteurs?.unobserve(e.target);
          });
        },
        { threshold: 0.6 },
      );
      compteurs.forEach((c) => ioCompteurs?.observe(c));
    } else {
      compteurs.forEach((c) => (c.textContent = c.dataset.compteur ?? ""));
    }

    /* ---------- Ligne de traversée et barre flottante ---------- */
    const ligne = document.querySelector<HTMLElement>(".traversee");
    const flottante = document.getElementById("flottante");
    const hero = document.querySelector<HTMLElement>(".hero");
    let attente = false;
    const surDefilement = () => {
      if (attente) return;
      attente = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        ligne?.style.setProperty(
          "--progression",
          String(max > 0 ? Math.min(1, y / max) : 0),
        );
        if (flottante && hero) {
          const montrer =
            y > hero.offsetHeight * 0.75 &&
            window.innerHeight + y <
              document.documentElement.scrollHeight - 420;
          flottante.classList.toggle("visible", montrer);
          flottante.setAttribute("aria-hidden", String(!montrer));
          const lien = flottante.querySelector("a");
          if (lien) lien.tabIndex = montrer ? 0 : -1;
        }
        attente = false;
      });
    };
    window.addEventListener("scroll", surDefilement, { passive: true });
    window.addEventListener("resize", surDefilement);
    surDefilement();

    return () => {
      window.clearInterval(horloge);
      ioCompteurs?.disconnect();
      window.removeEventListener("scroll", surDefilement);
      window.removeEventListener("resize", surDefilement);
    };
  }, []);

  return null;
}

/** Les quatre cases du compte à rebours. Les valeurs arrivent par `Mouvement`. */
export function CompteARebours({ className = "" }: { className?: string }) {
  return (
    <div
      className={`compte ${className}`}
      role="timer"
      aria-label="Compte à rebours avant le gala"
    >
      <div>
        <b className="tnum" data-cd="j">
          0
        </b>
        <span>JOURS</span>
      </div>
      <div>
        <b className="tnum" data-cd="h">
          00
        </b>
        <span>HEURES</span>
      </div>
      <div>
        <b className="tnum" data-cd="m">
          00
        </b>
        <span>MIN</span>
      </div>
      <div>
        <b className="tnum" data-cd="s">
          00
        </b>
        <span>SEC</span>
      </div>
    </div>
  );
}
