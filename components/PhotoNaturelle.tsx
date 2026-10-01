import Image from "next/image";

/**
 * Une photo dans ses propres proportions.
 *
 * Un cadre fixe rogne ce qui n'a pas sa forme : une capture d'écran, une
 * affiche, un portrait y perdaient leurs bords. Ici le cadre est la photo
 * elle-même.
 *
 * Deux façons de la poser. Sans plafond, elle prend toute la largeur
 * offerte et la hauteur qui va avec — la case d'une grille. Avec un
 * plafond, elle ne dépasse ni la largeur offerte ni cette hauteur, et se
 * centre : une photo en hauteur reste étroite, sans bandes de chaque côté.
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
  plafond,
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
      className={`block h-auto ${
        plafond ? `mx-auto w-auto max-w-full ${plafond}` : "w-full"
      } ${className}`}
    />
  );
}
