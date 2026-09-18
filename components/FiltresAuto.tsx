"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useTransition, type ReactNode } from "react";

/** Délai après la dernière frappe avant de filtrer : on n'interroge pas le serveur à chaque lettre. */
const DELAI_SAISIE = 350;

/**
 * Formulaire de filtres qui s'applique tout seul.
 *
 * Un menu déroulant filtre dès qu'on le change ; un champ de recherche, un
 * court instant après la dernière frappe. Plus de bouton « Filtrer » : c'était
 * un geste de trop. Les filtres restent dans l'adresse — partageables, et
 * retrouvés au retour arrière.
 *
 * Sans JavaScript, le formulaire reste un formulaire GET ordinaire : Entrée
 * l'envoie, et un bouton masqué le rend accessible au clavier et aux lecteurs
 * d'écran.
 */
export function FiltresAuto({
  action,
  className,
  children,
}: {
  action?: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [enCours, demarrer] = useTransition();
  const formulaire = useRef<HTMLFormElement>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout>>(undefined);
  /** Dernière adresse demandée par le formulaire lui-même. */
  const soumis = useRef<string | null>(null);

  const appliquer = () => {
    clearTimeout(minuterie.current);
    const form = formulaire.current;
    if (!form) return;
    const q = new URLSearchParams();
    for (const [cle, valeur] of new FormData(form)) {
      if (typeof valeur === "string" && valeur.trim())
        q.set(cle, valeur.trim());
    }
    const chaine = q.toString();
    soumis.current = chaine;
    demarrer(() =>
      router.replace(chaine ? `${pathname}?${chaine}` : pathname, {
        scroll: false,
      }),
    );
  };

  // Un lien « Effacer les filtres » change l'adresse sans passer par le
  // formulaire : les champs, non contrôlés, doivent alors la suivre.
  const chaine = params.toString();
  useEffect(() => {
    if (soumis.current === chaine) return;
    const form = formulaire.current;
    if (!form) return;
    for (const el of Array.from(form.elements)) {
      const saisie =
        (el instanceof HTMLInputElement &&
          el.type !== "hidden" &&
          el.type !== "submit") ||
        el instanceof HTMLSelectElement;
      if (saisie) el.value = params.get(el.name) ?? "";
    }
  }, [chaine, params]);

  useEffect(() => () => clearTimeout(minuterie.current), []);

  return (
    <form
      ref={formulaire}
      action={action}
      role="search"
      aria-busy={enCours}
      className={`${className ?? ""} transition-opacity ${enCours ? "opacity-70" : ""}`}
      onChange={(e) => {
        if (e.target instanceof HTMLSelectElement) {
          appliquer();
        } else {
          clearTimeout(minuterie.current);
          minuterie.current = setTimeout(appliquer, DELAI_SAISIE);
        }
      }}
      onSubmit={(e) => {
        e.preventDefault();
        appliquer();
      }}
    >
      {children}
      <button type="submit" className="sr-only">
        Filtrer
      </button>
    </form>
  );
}
