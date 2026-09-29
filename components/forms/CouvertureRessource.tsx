"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, LoaderCircle } from "lucide-react";

/**
 * La couverture d'une ressource, vue avant l'envoi.
 *
 * Il n'y a plus d'image à choisir : la carte montre le contenu lui-même.
 * - une photo est sa propre couverture ;
 * - un document prendra sa première page, rendue par le serveur ;
 * - une vidéo, une image prise dans le film. Le serveur ne sait pas décoder
 *   une vidéo : c'est le navigateur qui la lit ici, s'arrête un instant après
 *   le début — la toute première image est souvent noire —, la dessine, et
 *   l'envoie avec le formulaire sous le nom `couvertureVideo`.
 */
export function CouvertureRessource({
  fichier,
  actuelle,
}: {
  fichier: File | null;
  /** La couverture déjà en place, quand on modifie une ressource. */
  actuelle?: string | null;
}) {
  const champ = useRef<HTMLInputElement>(null);
  const video = fichier?.type.startsWith("video/") ?? false;
  const photo = fichier?.type.startsWith("image/") ?? false;

  // L'image tirée d'une vidéo, rattachée au fichier dont elle vient : un
  // résultat arrivé pour un fichier déjà remplacé est simplement ignoré.
  const [tiree, setTiree] = useState<{ de: File; url: string } | null>(null);
  const [echec, setEchec] = useState<File | null>(null);

  // Une photo est sa propre couverture : son adresse locale suffit.
  const urlPhoto = useMemo(
    () => (fichier && photo ? URL.createObjectURL(fichier) : null),
    [fichier, photo],
  );
  useEffect(
    () => () => {
      if (urlPhoto) URL.revokeObjectURL(urlPhoto);
    },
    [urlPhoto],
  );

  useEffect(() => {
    // Sans vidéo, rien ne doit partir sous `couvertureVideo`.
    if (champ.current) champ.current.value = "";
    if (!fichier || !video) return;

    let annule = false;
    const url = URL.createObjectURL(fichier);
    const lecteur = document.createElement("video");
    lecteur.muted = true;
    lecteur.playsInline = true;
    lecteur.preload = "auto";
    lecteur.src = url;

    // Trois essais, de plus en plus loin : un film qui s'ouvre sur un écran
    // blanc ou noir donnerait une couverture vide. On garde la première
    // image qui a quelque chose à montrer.
    const moments = [0.1, 0.25, 0.5];
    let essai = 0;
    const toile = document.createElement("canvas");

    lecteur.onloadedmetadata = () => {
      const echelle = Math.min(1, 1280 / (lecteur.videoWidth || 1280));
      toile.width = Math.round((lecteur.videoWidth || 1280) * echelle);
      toile.height = Math.round((lecteur.videoHeight || 720) * echelle);
      lecteur.currentTime = (lecteur.duration || 1) * moments[0];
    };
    lecteur.onseeked = () => {
      const contexte = toile.getContext("2d", { willReadFrequently: true });
      if (!contexte) return setEchec(fichier);
      contexte.drawImage(lecteur, 0, 0, toile.width, toile.height);
      if (imageUnie(contexte, toile) && ++essai < moments.length) {
        lecteur.currentTime = (lecteur.duration || 1) * moments[essai];
        return;
      }
      toile.toBlob(
        (blob) => {
          if (annule) return;
          if (!blob) return setEchec(fichier);
          const image = new File([blob], "couverture.jpg", {
            type: "image/jpeg",
          });
          const transfert = new DataTransfer();
          transfert.items.add(image);
          if (champ.current) champ.current.files = transfert.files;
          setTiree({ de: fichier, url: URL.createObjectURL(blob) });
        },
        "image/jpeg",
        0.82,
      );
    };
    // Un format que le navigateur ne lit pas : la carte gardera son motif.
    lecteur.onerror = () => {
      if (!annule) setEchec(fichier);
    };

    return () => {
      annule = true;
      lecteur.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [fichier, video]);

  const urlVideo = tiree && tiree.de === fichier ? tiree.url : null;
  const capture = video && !urlVideo && echec !== fichier;
  const apercu = urlPhoto ?? urlVideo;

  const image = apercu ?? (fichier ? null : (actuelle ?? null));

  return (
    <div>
      <span className="text-[12.3px] font-semibold text-muted">Couverture</span>
      <input
        ref={champ}
        type="file"
        name="couvertureVideo"
        accept="image/jpeg"
        tabIndex={-1}
        aria-hidden
        className="sr-only"
      />
      <div className="mt-1.5 flex aspect-[8/3] items-center justify-center overflow-hidden rounded-[var(--radius-m)] border border-line bg-surface-2">
        {capture ? (
          <span className="flex items-center gap-2 text-[12.4px] text-muted">
            <LoaderCircle size={15} className="animate-spin" aria-hidden />
            Image tirée de la vidéo…
          </span>
        ) : image ? (
          // Un aperçu local (blob:) : next/image ne sait pas l'optimiser.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt="Aperçu de la couverture"
            className="h-full w-full object-cover object-top"
          />
        ) : fichier ? (
          <span className="flex items-center gap-2 px-4 text-center text-[12.4px] text-muted">
            <FileText size={15} aria-hidden className="shrink-0" />
            La première page du document servira de couverture.
          </span>
        ) : (
          <span className="px-4 text-center text-[12.4px] text-faint">
            Tirée du fichier : première page, photo ou image de la vidéo.
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * L'image est-elle d'une seule couleur, ou presque ? On compare la
 * luminosité de quelques centaines de points : un écran blanc, noir ou un
 * fondu n'en montre presque aucune variation.
 */
function imageUnie(
  contexte: CanvasRenderingContext2D,
  toile: HTMLCanvasElement,
): boolean {
  const { data } = contexte.getImageData(0, 0, toile.width, toile.height);
  const pas = Math.max(4, Math.floor(data.length / 4 / 400)) * 4;
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += pas) {
    const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    if (l < min) min = l;
    if (l > max) max = l;
  }
  return max - min < 24;
}
