"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, X } from "lucide-react";

/**
 * Confirmation après une action.
 *
 * Le message arrive par l'URL (`?msg=`), déposé par l'action serveur. Il
 * s'efface au bout de quelques secondes et disparaît de l'adresse, pour qu'un
 * rechargement ne le réaffiche pas.
 */
export function Toast() {
  const message = useSearchParams().get("msg");
  // La clé force un remontage à chaque nouveau message : le minuteur repart,
  // et l'état d'affichage n'a pas à être remis à jour dans un effet.
  return message ? <ToastVisible key={message} message={message} /> : null;
}

function ToastVisible({ message }: { message: string }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const masquer = setTimeout(() => setVisible(false), 4200);
    const nettoyer = setTimeout(() => {
      const reste = new URLSearchParams(params.toString());
      reste.delete("msg");
      const query = reste.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 4600);

    return () => {
      clearTimeout(masquer);
      clearTimeout(nettoyer);
    };
  }, [pathname, params, router]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 max-w-[92vw] px-4 py-3 rounded-[var(--radius-s)] bg-navy text-white text-[13px] font-medium shadow-[var(--shadow)] transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <Check size={15} className="shrink-0" />
      <span>{message}</span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Fermer"
        className="ml-1 opacity-70 hover:opacity-100 cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  );
}
