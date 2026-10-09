import Image from "next/image";

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

export function normaliser(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function poids(octets: number): string {
  if (octets < 1024 * 1024)
    return `${Math.max(1, Math.round(octets / 1024))} ko`;
  return `${(octets / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}

export const urlPiece = (id: string, espace: string, telecharger = false) =>
  `/api/messagerie/pieces/${id}?espace=${espace}${telecharger ? "&telecharger=1" : ""}`;
