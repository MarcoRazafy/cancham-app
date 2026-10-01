import Image from "next/image";

/**
 * Une photo dans ses propres proportions.
 *
 * Un cadre fixe rogne ce qui n'a pas sa forme : une capture d'écran, une
 * affiche, un portrait y perdaient leurs bords. Ici la photo prend toute la
 * largeur offerte et la hauteur qui va avec. Une photo très haute s'arrête
 * au plafond et s'y inscrit en entier, sur le fond de son cadre.
 *
 * La largeur et la hauteur données à `Image` ne sont qu'une réserve de
 * place avant le chargement : avec `h-auto`, ce sont les proportions réelles
 * du fichier qui l'emportent dès qu'il arrive.
 */
export function PhotoNaturelle({
  src,
  alt,
  sizes,
  priority = false,
  plafond = "max-h-[620px]",
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  /** Hauteur maximale, en classe Tailwind écrite en entier. */
  plafond?: string;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1600}
      height={1200}
      sizes={sizes}
      priority={priority}
      className={`block h-auto w-full object-contain ${plafond} ${className}`}
    />
  );
}
