"use client";

import { useState } from "react";
import Link from "next/link";
import { BoutonMarque } from "@/components/paiement/BoutonMarque";
import { annoncerReglement } from "@/lib/actions/reglements";

/**
 * La référence de l'opération, et un bouton qui suit ce qu'on a fait.
 *
 * Comme sur la maquette : la plupart des membres arrivent ici *avant*
 * d'aller à la banque. Tant que le champ est vide, le geste utile est de
 * partir — « Je ferai le virement plus tard » ; la référence saisie, il
 * devient « J'ai fait le virement », qui prévient l'équipe. Rien n'est
 * annoncé par erreur, et personne n'a à chercher le bon bouton.
 */
export function AnnonceAdaptative({
  reglementId,
  libelle,
  aide,
  exemple,
  plusTard,
  fait,
  apres = "/membre/cotisations",
  champ = "",
}: {
  reglementId: string;
  libelle: string;
  /** À droite du libellé, en discret : « facultatif », « après le dépôt ». */
  aide: string;
  exemple: string;
  /** Le libellé du bouton tant que rien n'est saisi. */
  plusTard: string;
  /** Le libellé du bouton une fois la référence saisie. */
  fait: string;
  /** Où mène « plus tard ». */
  apres?: string;
  /** La forme du champ, pour suivre le dessin de chaque écran. */
  champ?: string;
}) {
  const [reference, setReference] = useState("");
  const saisie = reference.trim().length > 0;

  return (
    <form action={annoncerReglement}>
      <input type="hidden" name="reglementId" value={reglementId} />
      <label
        htmlFor="reference-operation"
        className="mb-1.5 block text-[14px] font-semibold text-ink"
      >
        {libelle} <span className="font-normal text-muted">{aide}</span>
      </label>
      <input
        id="reference-operation"
        name="refBancaire"
        maxLength={60}
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder={exemple}
        className={`min-h-12 w-full border border-line bg-surface px-4 text-[16px] text-ink placeholder:text-faint focus:border-[var(--pf-bouton)] focus:outline-none ${champ}`}
      />
      <div aria-live="polite" className="mt-5">
        {saisie ? (
          <BoutonMarque
            enCours="Envoi…"
            className="min-h-[52px] w-full rounded-[10px]"
          >
            {fait}
          </BoutonMarque>
        ) : (
          <Link
            href={apres}
            className="flex min-h-[52px] w-full items-center justify-center rounded-[10px] bg-[var(--pf-bouton)] px-6 text-[15px] font-bold text-[var(--pf-sur-bouton)] no-underline transition-colors duration-200 hover:bg-[var(--pf-bouton-survol)]"
          >
            {plusTard}
          </Link>
        )}
      </div>
    </form>
  );
}
