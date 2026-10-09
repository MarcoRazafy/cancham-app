"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, CircleAlert, X } from "lucide-react";

export function Toast() {
  const params = useSearchParams();
  const message = params.get("msg");
  const erreur = params.get("ton") === "erreur";
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
        <span
          aria-hidden
          className="absolute left-0 bottom-0 h-[2px] w-full bg-white/45 origin-left"
          style={{ animation: `decompte ${duree}ms linear both` }}
        />
      </div>
    </div>
  );
}
