"use client";

import { useState, type ReactNode } from "react";
import { Award, Printer } from "lucide-react";
import { Modal } from "@/components/Modal";
import { ModalFooter } from "@/components/form-bits";

/** Page d'impression du certificat, chargée dans un cadre invisible. */
const PAGE_IMPRESSION = "/membre/profil/certificat";

/**
 * « Mon certificat » : le certificat s'ouvre dans une fenêtre, sans quitter
 * la fiche.
 *
 * L'impression passe par un cadre invisible qui charge la page conçue pour le
 * papier, puis l'imprime : on obtient le certificat seul, sans la fiche ni la
 * fenêtre derrière — ce qu'une impression de la page courante n'aurait pas
 * donné.
 */
export function BoutonCertificat({ children }: { children: ReactNode }) {
  const [enCours, setEnCours] = useState(false);

  const imprimer = () => {
    setEnCours(true);
    const cadre = document.createElement("iframe");
    cadre.setAttribute("aria-hidden", "true");
    cadre.tabIndex = -1;
    Object.assign(cadre.style, {
      position: "fixed",
      right: "0",
      bottom: "0",
      width: "0",
      height: "0",
      border: "0",
    });

    // Le cadre reste le temps que la boîte d'impression se referme : le
    // retirer trop tôt l'annulerait dans certains navigateurs. Tous
    // n'annoncent pas cette fermeture (`afterprint`) : une minute au plus.
    let retire = false;
    const retirer = () => {
      if (retire) return;
      retire = true;
      cadre.remove();
    };

    cadre.onload = async () => {
      const fenetre = cadre.contentWindow;
      if (!fenetre) {
        setEnCours(false);
        return retirer();
      }
      // Les polices d'abord : sans elles, le titre partirait dans une police
      // de repli.
      try {
        await fenetre.document.fonts?.ready;
      } catch {
        /* Rien à attendre. */
      }
      fenetre.addEventListener("afterprint", () => setTimeout(retirer, 500), {
        once: true,
      });
      setTimeout(retirer, 60_000);
      fenetre.focus();
      fenetre.print();
      // `print()` rend la main une fois la boîte ouverte — ou refermée, selon
      // le navigateur : dans les deux cas, le bouton redevient disponible.
      setEnCours(false);
    };
    cadre.src = PAGE_IMPRESSION;
    document.body.appendChild(cadre);
  };

  return (
    <Modal
      title="Certificat d’adhésion"
      largeur="max-w-[820px]"
      trigger={(ouvrir) => (
        <button type="button" onClick={ouvrir} className="btn-action">
          <Award size={16} /> Mon certificat
        </button>
      )}
    >
      {() => (
        <>
          <div className="p-4 sm:p-6 bg-surface-2">{children}</div>
          <ModalFooter>
            <button
              type="button"
              onClick={imprimer}
              disabled={enCours}
              className="btn-action btn-action-sm"
            >
              <Printer size={15} />
              {enCours ? "Préparation…" : "Imprimer / Exporter PDF"}
            </button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
