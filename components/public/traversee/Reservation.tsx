"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { fmtMoney } from "@/lib/format";
import {
  adresseInscription,
  EVENEMENT,
  verifierReservation,
  type ChampReservation,
} from "@/lib/traversee";

const CHAMPS: {
  cle: ChampReservation;
  libelle: string;
  type: "text" | "email" | "tel";
  autoComplete: string;
  max: number;
  placeholder?: string;
}[] = [
  {
    cle: "nom",
    libelle: "Nom",
    type: "text",
    autoComplete: "family-name",
    max: 60,
  },
  {
    cle: "prenom",
    libelle: "Prénom",
    type: "text",
    autoComplete: "given-name",
    max: 60,
  },
  {
    cle: "entreprise",
    libelle: "Entreprise",
    type: "text",
    autoComplete: "organization",
    max: 120,
  },
  {
    cle: "role",
    libelle: "Rôle ou fonction",
    type: "text",
    autoComplete: "organization-title",
    max: 80,
  },
  {
    cle: "email",
    libelle: "Adresse e-mail",
    type: "email",
    autoComplete: "email",
    max: 120,
    placeholder: "vous@entreprise.mg",
  },
  {
    cle: "telephone",
    libelle: "Téléphone",
    type: "tel",
    autoComplete: "tel",
    max: 24,
    placeholder: "+261 34 12 345 67",
  },
];

const ANCRE = "#reserver";

export function Reservation({
  plateforme,
  prixPass,
}: {
  plateforme: string;
  prixPass: number;
}) {
  const fenetre = useRef<HTMLDialogElement>(null);
  const [erreurs, setErreurs] = useState<
    Partial<Record<ChampReservation, string>>
  >({});
  const [depart, setDepart] = useState(false);

  useEffect(() => {
    const ouvrir = () => {
      const d = fenetre.current;
      if (!d || d.open) return;
      setErreurs({});
      setDepart(false);
      d.showModal();
      d.querySelector<HTMLInputElement>("input")?.focus();
    };
    const auClic = (e: MouseEvent) => {
      const cible = e.target instanceof Element ? e.target : null;
      if (!cible?.closest("[data-reserver]")) return;
      e.preventDefault();
      ouvrir();
    };
    document.addEventListener("click", auClic);
    if (window.location.hash === ANCRE) ouvrir();
    return () => document.removeEventListener("click", auClic);
  }, []);

  const fermer = () => fenetre.current?.close();

  const auFermer = () => {
    setDepart(false);
    if (window.location.hash === ANCRE) {
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  };

  const soumettre = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const donnees = new FormData(e.currentTarget);
    const verdict = verifierReservation(
      Object.fromEntries(CHAMPS.map((c) => [c.cle, donnees.get(c.cle)])),
    );
    if (!verdict.ok) {
      setErreurs(verdict.erreurs);
      const premier = CHAMPS.find((c) => verdict.erreurs[c.cle]);
      if (premier) {
        e.currentTarget
          .querySelector<HTMLInputElement>(`[name="${premier.cle}"]`)
          ?.focus();
      }
      return;
    }
    setErreurs({});
    setDepart(true);
    window.location.assign(adresseInscription(plateforme, verdict.valeurs));
  };

  return (
    <dialog
      ref={fenetre}
      className="reservation"
      aria-labelledby="reservation-titre"
      onClose={auFermer}
      onClick={(e) => {
        if (e.target === e.currentTarget) fermer();
      }}
    >
      <div className="reservation-boite">
        <button
          type="button"
          className="reservation-fermer"
          aria-label="Fermer"
          onClick={fermer}
        >
          <X size={18} aria-hidden />
        </button>
        <p className="reservation-sur">
          {EVENEMENT.nom} · 18 décembre · {EVENEMENT.lieuCourt}
        </p>
        <h2 id="reservation-titre">Réserver mon billet</h2>
        <p className="reservation-intro">
          Vos coordonnées d’abord. Vous créerez ensuite votre accès sur la
          plateforme La Traversée. Billet : {fmtMoney(prixPass)}.
        </p>

        <form noValidate onSubmit={soumettre}>
          <div className="reservation-grille">
            {CHAMPS.map((c) => {
              const erreur = erreurs[c.cle];
              return (
                <label key={c.cle} className="reservation-champ">
                  <span>{c.libelle}</span>
                  <input
                    name={c.cle}
                    type={c.type}
                    required
                    maxLength={c.max}
                    autoComplete={c.autoComplete}
                    placeholder={c.placeholder}
                    inputMode={
                      c.type === "email"
                        ? "email"
                        : c.type === "tel"
                          ? "tel"
                          : undefined
                    }
                    aria-invalid={erreur ? true : undefined}
                    aria-describedby={
                      erreur ? `reservation-erreur-${c.cle}` : undefined
                    }
                  />
                  {erreur ? (
                    <small id={`reservation-erreur-${c.cle}`} role="alert">
                      {erreur}
                    </small>
                  ) : null}
                </label>
              );
            })}
          </div>
          <button
            type="submit"
            className="btn btn-rouge reservation-envoi"
            disabled={depart}
          >
            {depart ? "Redirection…" : "Continuer vers mon inscription →"}
          </button>
          <p className="reservation-mention">
            Vous finaliserez votre inscription sur la plateforme La Traversée
          </p>
        </form>
      </div>
    </dialog>
  );
}
