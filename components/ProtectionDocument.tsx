"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Document qui se regarde et s'imprime, mais ne se recopie pas.
 *
 * Ce que cela fait, et ce que cela ne peut pas faire, doit être dit
 * clairement : aucune page web n'empêche une capture d'écran, ni une photo de
 * l'écran prise au téléphone, ni l'inspecteur du navigateur. Ce qui suit rend
 * la récupération pénible ; cela ne la rend pas impossible.
 *
 * Sont neutralisés : la sélection du texte, le copier, le menu contextuel —
 * donc « Enregistrer l'image sous… » —, le glisser-déposer d'une image, et
 * les raccourcis d'enregistrement et de copie tant que le document est à
 * l'écran.
 *
 * L'impression, elle, reste entière : c'est l'usage prévu du document, et
 * c'est par elle que passe l'export en PDF. Ctrl + P n'est donc pas touché.
 */
export function ProtectionDocument({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    const bloquer = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["s", "c", "a"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", bloquer);
    return () => window.removeEventListener("keydown", bloquer);
  }, []);

  const empecher = (e: { preventDefault: () => void }) => e.preventDefault();

  return (
    <div
      className={`select-none [&_img]:pointer-events-none [&_img]:select-none ${className}`}
      onContextMenu={empecher}
      onDragStart={empecher}
      onCopy={empecher}
      onCut={empecher}
    >
      {children}
    </div>
  );
}
