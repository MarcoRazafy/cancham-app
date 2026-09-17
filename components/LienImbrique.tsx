"use client";

import type { ReactNode } from "react";

/**
 * Lien posé à l'intérieur d'une carte déjà cliquable.
 *
 * Un `<a>` dans un `<a>` est du HTML invalide : le navigateur referme le
 * premier lien avant d'ouvrir le second, et la carte se brise en morceaux.
 * On rend donc un `<span>` qui ouvre l'adresse lui-même, et qui empêche le
 * clic de remonter jusqu'à la carte.
 */
export function LienImbrique({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  const ouvrir = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(
      href,
      href.startsWith("mailto:") ? "_self" : "_blank",
      "noopener,noreferrer",
    );
  };
  return (
    <span
      role="link"
      tabIndex={0}
      onClick={ouvrir}
      onKeyDown={(e) => {
        if (e.key === "Enter") ouvrir(e);
      }}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </span>
  );
}
