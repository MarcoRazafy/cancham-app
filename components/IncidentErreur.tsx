"use client";

import { useEffect } from "react";
import Link from "next/link";
import { House, RotateCw, TriangleAlert } from "lucide-react";
import { Incident } from "@/components/Incident";

/**
 * Incident dans une page : le contenu a planté, la coquille tient.
 *
 * En production, le message d'origine ne quitte pas le serveur — il pourrait
 * contenir des détails internes. On affiche à la place sa référence
 * (`digest`), la même que dans les journaux du serveur : l'équipe retrouve
 * l'erreur exacte à partir de ce que le membre lui transmet.
 */
export function IncidentErreur({
  error,
  retry,
  accueil,
  pleinEcran = false,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  accueil: string;
  pleinEcran?: boolean;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Incident
      pleinEcran={pleinEcran}
      icone={<TriangleAlert size={24} />}
      surtitre="Incident"
      titre="Cette page n’a pas pu s’afficher"
      actions={
        <>
          <button
            type="button"
            onClick={() => retry()}
            className="btn-action btn-action-sm"
          >
            <RotateCw size={15} aria-hidden /> Réessayer
          </button>
          <Link
            href={accueil}
            className="inline-flex items-center gap-[7px] rounded-[var(--radius-s)] font-semibold border border-line bg-surface text-ink no-underline text-[13.4px] px-[15px] py-[9px] hover:border-ink/30 transition-colors"
          >
            <House size={15} aria-hidden /> Retour à l’accueil
          </Link>
        </>
      }
    >
      <p className="m-0">
        Un problème est survenu de notre côté. Réessayez dans un instant ; s’il
        persiste, écrivez à l’équipe CanCham.
      </p>
      {error.digest ? (
        <p className="m-0 mt-3 text-[12px] text-faint">
          Référence à communiquer :{" "}
          <code className="font-mono text-muted select-all">
            {error.digest}
          </code>
        </p>
      ) : null}
    </Incident>
  );
}
