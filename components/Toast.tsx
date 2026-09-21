"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, CircleAlert, X } from "lucide-react";

/**
 * Message de retour après une action.
 *
 * Il arrive par l'URL (`?msg=`, et `&ton=erreur` pour une erreur), déposé par
 * l'action serveur. Il s'efface seul et disparaît de l'adresse, pour qu'un
 * rechargement ne le réaffiche pas.
 *
 * Les deux tons ne bougent pas pareil. Une confirmation glisse en place et sa
 * coche se dessine : c'est fait. Une erreur arrive en secouant la tête, en
 * rouge, et reste plus longtemps : elle demande qu'on la lise. Une fine barre
 * dit combien de temps il reste avant qu'elle ne s'efface.
 */
export function Toast() {
  const params = useSearchParams();
  const message = params.get("msg");
  const erreur = params.get("ton") === "erreur";
  // La clé force un remontage à chaque nouveau message : le minuteur repart,
  // et les animations se rejouent.
  return message ? (
    <ToastVisible
      key={`${erreur}:${message}`}
      message={message}
      erreur={erreur}
    />
  ) : null;
}

const DUREE = { succes: 4200, erreur: 6500 };

function ToastVisible({
  message,
  erreur,
}: {
  message: string;
  erreur: boolean;
}) {
  const [visible, setVisible] = useState(true);
  const duree = erreur ? DUREE.erreur : DUREE.succes;

  useEffect(() => {
    const masquer = setTimeout(() => setVisible(false), duree);
    // Le message quitte l'adresse sans navigation : `replaceState` réécrit
    // l'URL, et Next suit. Une navigation (`router.replace`) aurait pu
    // écraser celle d'une action lancée entre-temps — cliquer « Terminer »
    // juste après un « ajouté » ramenait sur la page quittée. Et seulement
    // si l'adresse porte encore ce message : sinon, on est déjà ailleurs.
    const nettoyer = setTimeout(() => {
      const url = new URL(window.location.href);
      if (url.searchParams.get("msg") !== message) return;
      url.searchParams.delete("msg");
      url.searchParams.delete("ton");
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    }, duree + 400);

    return () => {
      clearTimeout(masquer);
      clearTimeout(nettoyer);
    };
  }, [message, duree]);

  return (
    <div
      role={erreur ? "alert" : "status"}
      aria-live={erreur ? "assertive" : "polite"}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] max-w-[92vw] transition-opacity duration-300 ${
        visible ? "anim-glisse" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* L'entrée glisse ; la secousse d'une erreur vit sur l'enveloppe
          intérieure, pour ne pas se disputer la même transformation. */}
      <div
        className={`relative overflow-hidden flex items-center gap-2.5 pl-3 pr-3.5 py-3 rounded-[var(--radius-s)] text-white text-[13px] font-medium shadow-[0_16px_40px_-14px_rgba(15,29,44,0.55)] ${
          erreur ? "bg-[var(--refus)] anim-secousse" : "bg-navy"
        }`}
        style={erreur ? { animationDelay: "180ms" } : undefined}
      >
        <span
          aria-hidden
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 anim-rebond ${
            erreur ? "bg-white/20" : "bg-[#1f9d63]"
          }`}
        >
          {erreur ? (
            <CircleAlert size={15} />
          ) : (
            <Check size={14} strokeWidth={3} className="anim-trace" />
          )}
        </span>
        <span>{message}</span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Fermer"
          className="ml-1 opacity-70 hover:opacity-100 cursor-pointer bg-transparent border-0 text-white"
        >
          <X size={14} />
        </button>
        {/* Le temps qu'il reste avant que le message s'efface. */}
        <span
          aria-hidden
          className="absolute left-0 bottom-0 h-[2px] w-full bg-white/45 origin-left"
          style={{ animation: `decompte ${duree}ms linear both` }}
        />
      </div>
    </div>
  );
}
