import Image from "next/image";

/**
 * Petits outils partagés par les composants de la messagerie.
 *
 * Volontairement hors de `components/domain.tsx` : ces composants sont des
 * composants client, et importer `domain` les obligerait à embarquer tout ce
 * module dans le navigateur pour un simple rond.
 */

export function Pastille({
  src,
  alt,
  initiales,
  taille,
  className = "",
}: {
  src?: string | null;
  alt: string;
  initiales: string;
  taille: number;
  className?: string;
}) {
  if (src) {
    return (
      <span
        className="rounded-full overflow-hidden shrink-0 block bg-line"
        style={{ width: taille, height: taille }}
      >
        <Image
          src={src}
          alt={alt}
          width={taille}
          height={taille}
          sizes={`${taille}px`}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }
  return (
    <span
      className={`rounded-full flex items-center justify-center font-bold shrink-0 ${className}`}
      style={{ width: taille, height: taille, fontSize: taille * 0.34 }}
    >
      {initiales}
    </span>
  );
}

/** Minuscules, sans accents : « Événement » et « evenement » se valent. */
export function normaliser(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Poids lisible : « 842 ko », « 3,4 Mo ». */
export function poids(octets: number): string {
  if (octets < 1024 * 1024)
    return `${Math.max(1, Math.round(octets / 1024))} ko`;
  return `${(octets / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}

/** URL d'une pièce jointe, servie par la route contrôlée. */
export const urlPiece = (id: string, telecharger = false) =>
  `/api/messagerie/pieces/${id}${telecharger ? "?telecharger=1" : ""}`;
