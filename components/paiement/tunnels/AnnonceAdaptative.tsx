"use client";

import { useState } from "react";
import Link from "next/link";
import { BoutonMarque } from "@/components/paiement/BoutonMarque";
import { annoncerReglement } from "@/lib/actions/reglements";

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
  aide: string;
  exemple: string;
  plusTard: string;
  fait: string;
  apres?: string;
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
