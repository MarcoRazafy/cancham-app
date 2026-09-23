"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { inscrireInfolettre } from "@/lib/actions/infolettre";

/**
 * Le formulaire de la lettre d'information.
 *
 * Prénom et adresse, comme sur la page d'inscription de la chambre, et le
 * même mot de remerciement. L'inscription est enregistrée par la plateforme :
 * l'équipe la retrouve dans son journal d'activité.
 */

const CHAMP =
  "h-13 rounded-md bg-white px-5 text-[15px] text-[var(--marque-nuit)] outline-none placeholder:text-[#8797a6] focus:ring-2 focus:ring-white/70";

export function FormulaireInfolettre() {
  const [merci, setMerci] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [champFautif, setChampFautif] = useState<string | null>(null);
  const [envoi, demarrer] = useTransition();

  const envoyer = (formData: FormData) => {
    setErreur(null);
    setChampFautif(null);
    demarrer(async () => {
      const r = await inscrireInfolettre({
        prenom: String(formData.get("prenom") ?? ""),
        email: String(formData.get("email") ?? ""),
      });
      if (r.ok) setMerci(r.message);
      else {
        setErreur(r.erreur);
        setChampFautif(r.champ ?? null);
      }
    });
  };

  if (merci) {
    return (
      <p
        role="status"
        className="mt-10 mx-auto flex max-w-[670px] items-center justify-center gap-2.5 rounded-md bg-white/15 px-6 py-5 text-[16px] font-semibold text-white"
      >
        <CheckCircle2 size={20} aria-hidden className="shrink-0" />
        {merci}
      </p>
    );
  }

  return (
    <form
      action={envoyer}
      className="mt-10 mx-auto flex max-w-[670px] flex-col gap-2.5"
    >
      <label className="sr-only" htmlFor="infolettre-prenom">
        Prénom
      </label>
      <input
        id="infolettre-prenom"
        name="prenom"
        required
        autoComplete="given-name"
        placeholder="Prénom"
        className={
          champFautif === "prenom" ? `${CHAMP} ring-2 ring-white` : CHAMP
        }
      />

      <label className="sr-only" htmlFor="infolettre-email">
        E-mail
      </label>
      <input
        id="infolettre-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="E-mail"
        className={
          champFautif === "email" ? `${CHAMP} ring-2 ring-white` : CHAMP
        }
      />

      <button
        type="submit"
        disabled={envoi}
        className="h-13 rounded-md bg-marque-rouge text-[15px] font-bold text-white transition-colors hover:bg-[#8f0606] disabled:opacity-70 cursor-pointer"
      >
        {envoi ? "Inscription…" : "S’inscrire"}
      </button>

      {erreur ? (
        <p role="alert" className="m-0 text-[13.5px] text-white">
          {erreur}
        </p>
      ) : null}
    </form>
  );
}
