"use client";

import { useLinkStatus } from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, LoaderCircle, RotateCw } from "lucide-react";

export function EnCoursLien() {
  const { pending } = useLinkStatus();
  return (
    <LoaderCircle
      size={14}
      aria-hidden
      className={`shrink-0 transition-opacity ${
        pending ? "opacity-80 animate-spin" : "opacity-0"
      }`}
    />
  );
}

const SEUIL = 70;

function dansUnDefilement(cible: EventTarget | null): boolean {
  let el = cible instanceof Element ? cible : null;
  while (el && el !== document.body) {
    const style = getComputedStyle(el);
    if (/(auto|scroll)/.test(style.overflowY) && el.scrollTop > 0) return true;
    el = el.parentElement;
  }
  return false;
}

export function TirerPourRafraichir() {
  const router = useRouter();
  const [tirage, setTirage] = useState(0);
  const [fait, setFait] = useState(false);
  const [enCours, demarrer] = useTransition();
  const depart = useRef<number | null>(null);
  const courant = useRef(0);

  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    const debut = (e: TouchEvent) => {
      const cible = e.target as Element | null;
      const exclu =
        window.scrollY > 0 ||
        e.touches.length !== 1 ||
        cible?.closest("dialog, [role=dialog]") ||
        dansUnDefilement(cible);
      depart.current = exclu ? null : e.touches[0].clientY;
    };

    const deplace = (e: TouchEvent) => {
      if (depart.current === null) return;
      const ecart = e.touches[0].clientY - depart.current;
      if (ecart <= 0 || window.scrollY > 0) {
        courant.current = 0;
        setTirage(0);
        return;
      }
      courant.current = Math.min(ecart * 0.5, SEUIL * 1.5);
      setTirage(courant.current);
    };

    const fin = () => {
      if (depart.current === null) return;
      depart.current = null;
      const assez = courant.current >= SEUIL;
      courant.current = 0;
      setTirage(0);
      if (assez) {
        demarrer(() => router.refresh());
        setFait(true);
        setTimeout(() => setFait(false), 1600);
      }
    };

    window.addEventListener("touchstart", debut, { passive: true });
    window.addEventListener("touchmove", deplace, { passive: true });
    window.addEventListener("touchend", fin);
    window.addEventListener("touchcancel", fin);
    return () => {
      window.removeEventListener("touchstart", debut);
      window.removeEventListener("touchmove", deplace);
      window.removeEventListener("touchend", fin);
      window.removeEventListener("touchcancel", fin);
    };
  }, [router]);

  const visible = tirage > 4 || enCours || fait;
  if (!visible) return null;

  const pret = tirage >= SEUIL;
  const decalage = enCours || fait ? SEUIL * 0.6 : tirage * 0.6;

  return (
    <div
      aria-live="polite"
      className="lg:hidden fixed left-1/2 top-[64px] z-[45] pointer-events-none"
      style={{
        transform: `translate(-50%, ${decalage}px)`,
        transition: tirage ? "none" : "transform 220ms ease-out",
      }}
    >
      <span
        className={`w-10 h-10 rounded-full bg-surface border border-line shadow-[0_8px_24px_-10px_rgba(15,29,44,0.5)] flex items-center justify-center ${
          pret || enCours ? "text-accent" : "text-muted"
        }`}
        style={{ opacity: enCours || fait ? 1 : Math.min(1, tirage / SEUIL) }}
      >
        {enCours ? (
          <>
            <LoaderCircle size={18} className="animate-spin" aria-hidden />
            <span className="sr-only">Actualisation…</span>
          </>
        ) : fait ? (
          <>
            <Check
              size={18}
              strokeWidth={3}
              className="text-success anim-trace anim-rebond"
              aria-hidden
            />
            <span className="sr-only">Page à jour</span>
          </>
        ) : (
          <RotateCw
            size={18}
            aria-hidden
            style={{ transform: `rotate(${(tirage / SEUIL) * 270}deg)` }}
          />
        )}
      </span>
    </div>
  );
}

export function RetoursFormulaire() {
  useEffect(() => {
    const refuse = (e: Event) => {
      const champ = e.target as HTMLElement;
      champ.classList.remove("champ-refuse");
      void champ.offsetWidth;
      champ.classList.add("champ-refuse");
      champ.addEventListener(
        "animationend",
        () => champ.classList.remove("champ-refuse"),
        { once: true },
      );
    };
    document.addEventListener("invalid", refuse, true);
    return () => document.removeEventListener("invalid", refuse, true);
  }, []);
  return null;
}
