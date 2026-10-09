"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

export function LecteurProtege({ children }: { children: ReactNode }) {
  const [masque, setMasque] = useState(false);

  useEffect(() => {
    const bloquer = (e: KeyboardEvent) => {
      const touche = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["s", "p", "c", "a"].includes(touche)) {
        e.preventDefault();
      }
      if (e.key === "PrintScreen") {
        setMasque(true);
        setTimeout(() => setMasque(false), 1200);
      }
    };
    let veille: ReturnType<typeof setInterval> | null = null;
    const arreter = () => {
      if (veille) clearInterval(veille);
      veille = null;
    };
    const juger = () => setMasque(!document.hasFocus());
    const perdre = () => {
      arreter();
      setTimeout(juger, 80);
      veille = setInterval(juger, 400);
    };
    const retrouver = () => {
      arreter();
      setMasque(false);
    };
    const visibilite = () => setMasque(document.visibilityState !== "visible");

    window.addEventListener("keydown", bloquer);
    window.addEventListener("keyup", bloquer);
    window.addEventListener("blur", perdre);
    window.addEventListener("focus", retrouver);
    document.addEventListener("visibilitychange", visibilite);
    return () => {
      window.removeEventListener("keydown", bloquer);
      window.removeEventListener("keyup", bloquer);
      arreter();
      window.removeEventListener("blur", perdre);
      window.removeEventListener("focus", retrouver);
      document.removeEventListener("visibilitychange", visibilite);
    };
  }, []);

  return (
    <div className="lecteur-protege" data-masque={masque ? "oui" : undefined}>
      <div className="flex items-center gap-2 text-[12.4px] text-muted mb-3">
        <ShieldCheck size={15} className="text-success-strong shrink-0" />
        Consultation réservée aux membres. Contenu protégé.
      </div>

      <div
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        className={`relative select-none transition-[filter] duration-200 [-webkit-touch-callout:none] ${
          masque ? "blur-xl" : ""
        }`}
      >
        {children}
      </div>

      {masque ? (
        <p className="text-center text-[13px] text-muted mt-4">
          Contenu masqué tant que la fenêtre n’est pas active.
        </p>
      ) : null}
    </div>
  );
}

export function PagesDocument({
  id,
  pages,
  titre,
}: {
  id: string;
  pages: number;
  titre: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      {Array.from({ length: pages }, (_, i) => (
        <div
          key={i}
          className="relative w-full max-w-[860px] bg-white rounded-[var(--radius-s)] shadow-[0_6px_24px_-12px_rgba(15,29,44,0.35)] overflow-hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/ressources/${id}/pages/${i + 1}`}
            alt={`${titre} — page ${i + 1} sur ${pages}`}
            loading={i < 2 ? "eager" : "lazy"}
            draggable={false}
            className="block w-full h-auto pointer-events-none"
          />
          <span className="absolute inset-0" aria-hidden />
          <span className="absolute bottom-2 right-3 text-[11px] text-faint tabular-nums">
            {i + 1} / {pages}
          </span>
        </div>
      ))}
    </div>
  );
}

export function VideoProtegee({ id, titre }: { id: string; titre: string }) {
  return (
    <div className="relative w-full max-w-[960px] mx-auto rounded-[var(--radius-m)] overflow-hidden bg-black">
      <video
        src={`/api/ressources/${id}/video`}
        controls
        controlsList="nodownload noremoteplayback noplaybackrate"
        disablePictureInPicture
        disableRemotePlayback
        playsInline
        preload="metadata"
        aria-label={titre}
        className="block w-full h-auto"
      />
    </div>
  );
}
