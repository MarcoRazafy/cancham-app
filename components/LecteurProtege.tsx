"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

/**
 * Lecteur de ressource, dans la plateforme.
 *
 * Ce que ce composant fait, et ce qu'il ne peut pas faire, doit être dit
 * clairement : aucune page web ne peut empêcher une capture d'écran, ni une
 * photo de l'écran prise au téléphone. Ce qui suit rend la copie pénible et la
 * fuite traçable ; cela ne la rend pas impossible.
 *
 * Côté serveur, déjà : le fichier ne quitte jamais le stockage. Un document
 * arrive ici page par page, en images, sans couche de texte à sélectionner.
 * Une vidéo arrive par morceaux, sans lien de téléchargement. Une page
 * composée dans la plateforme, elle, est faite de vrai texte : c'est ce
 * composant seul qui en empêche la sélection et la copie.
 *
 * Côté navigateur, ce composant ajoute :
 *  - pas de menu contextuel, pas de glisser-déposer, pas de sélection ;
 *  - Ctrl/Cmd + S, P, C et A neutralisés tant que le lecteur est ouvert ;
 *  - rien à l'impression ;
 *  - le contenu se floute quand la fenêtre perd le focus — le geste qui
 *    précède la plupart des outils de capture ;
 *  - sur la vidéo, pas de bouton de téléchargement ni d'image dans l'image.
 */
export function LecteurProtege({ children }: { children: ReactNode }) {
  const [masque, setMasque] = useState(false);

  useEffect(() => {
    const bloquer = (e: KeyboardEvent) => {
      const touche = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["s", "p", "c", "a"].includes(touche)) {
        e.preventDefault();
      }
      // Impr. écran : on ne peut pas l'empêcher, on masque le temps de la frappe.
      if (e.key === "PrintScreen") {
        setMasque(true);
        setTimeout(() => setMasque(false), 1200);
      }
    };
    /*
     * La fenêtre perd le focus quand on la quitte — et aussi quand on clique
     * dans le cadre d'une vidéo de la page (YouTube, Vimeo, Google Drive).
     * Dans ce second cas on n'a rien quitté, et flouter la page empêcherait
     * de regarder la vidéo : `hasFocus` fait la différence, il reste vrai
     * tant que le focus est dans un cadre de la page.
     *
     * Une fois dans le cadre, la fenêtre ne prévient plus de rien : on
     * regarde donc à intervalles si le focus est toujours là, jusqu'à ce
     * qu'il revienne à la page.
     */
    let veille: ReturnType<typeof setInterval> | null = null;
    const arreter = () => {
      if (veille) clearInterval(veille);
      veille = null;
    };
    const juger = () => setMasque(!document.hasFocus());
    const perdre = () => {
      arreter();
      // Un instant : le temps que le focus arrive dans le cadre.
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
    <div className="lecteur-protege">
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

/** Pages d'un document, chargées une à une au fil du défilement. */
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
          {/*
            Une <img> ordinaire, pas next/image : l'optimiseur d'images de Next
            mettrait les pages en cache sous une URL publique, qui contournerait
            le contrôle d'accès de la route.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/ressources/${id}/pages/${i + 1}`}
            alt={`${titre} — page ${i + 1} sur ${pages}`}
            loading={i < 2 ? "eager" : "lazy"}
            draggable={false}
            className="block w-full h-auto pointer-events-none"
          />
          {/* Voile transparent : un clic droit ou un glisser tombe sur lui, pas sur l'image. */}
          <span className="absolute inset-0" aria-hidden />
          <span className="absolute bottom-2 right-3 text-[11px] text-faint tabular-nums">
            {i + 1} / {pages}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Vidéo servie par morceaux, sans téléchargement. */
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
