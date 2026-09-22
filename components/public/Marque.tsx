import Image from "next/image";

/**
 * Éléments de marque, conformes à la charte CanCham.
 *
 * Règle de la charte : la version couleur sur fond pâle, la version renversée
 * sur fond foncé — la vitrine, bleu nuit, prend la renversée ; les pages de
 * connexion, claires, la version couleur. Le sigle seul ne
 * remplace jamais le logo — il est réservé aux usages listés par la charte
 * (avatar social, objet promotionnel, élément graphique), d'où son emploi ici
 * en simple ornement de fond.
 */

const LOGOS = {
  couleur: { src: "/marque/logo-couleur.png", width: 2536 },
  blanc: { src: "/marque/logo-blanc.png", width: 2383 },
} as const;

export function LogoOfficiel({
  className = "",
  priority = false,
  version = "couleur",
}: {
  className?: string;
  priority?: boolean;
  version?: keyof typeof LOGOS;
}) {
  return (
    <Image
      src={LOGOS[version].src}
      alt="CanCham — Chambre de Commerce et de Coopération Canada-Madagascar"
      width={LOGOS[version].width}
      height={711}
      priority={priority}
      className={className}
      sizes="(max-width: 768px) 260px, 340px"
    />
  );
}

export function Sigle({
  className = "",
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/marque/sigle.png"
      alt=""
      aria-hidden="true"
      width={1888}
      height={1159}
      className={className}
      style={{ width: size, height: "auto" }}
    />
  );
}
