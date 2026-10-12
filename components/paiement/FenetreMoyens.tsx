"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { GrilleMoyens } from "@/components/paiement/GrilleMoyens";
import {
  ouvrirReglement,
  reglerAchat,
  reglerCotisation,
} from "@/lib/actions/reglements";
import type { TypeAchat } from "@/lib/achat";
import type { ModeReglement } from "@/lib/modes-reglement";

export function FenetreMoyens({
  facture,
  cotisation,
  achat,
  modes,
  bientot = [],
  ouverteAuDepart = false,
  declencheur,
  classeDeclencheur = "",
}: {
  facture?: { id: string; numero: string; objet: string; montant: string };
  cotisation?: { formule: string | null; somme: string };
  achat?: { type: TypeAchat; id: string; titre: string; somme: string };
  modes: ModeReglement[];
  bientot?: ModeReglement[];
  ouverteAuDepart?: boolean;
  declencheur?: ReactNode;
  classeDeclencheur?: string;
}) {
  const [ouvert, setOuvert] = useState(ouverteAuDepart);
  const router = useRouter();
  const chemin = usePathname();

  const fermer = () => {
    setOuvert(false);
    if (ouverteAuDepart) router.replace(chemin, { scroll: false });
  };

  return (
    <>
      {declencheur ? (
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className={classeDeclencheur}
        >
          {declencheur}
        </button>
      ) : null}
      <Modal
        title="Comment payerez-vous ?"
        largeur="max-w-[860px]"
        ouvert={ouvert}
        onFermer={fermer}
      >
        {() => (
          <div className="px-5 py-5">
            {facture ? (
              <p className="m-0 text-[14px] text-muted">
                Facture{" "}
                <span className="font-[family-name:var(--font-mono)] text-ink">
                  {facture.numero}
                </span>{" "}
                · {facture.objet} ·{" "}
                <b className="text-ink">{facture.montant}</b>
              </p>
            ) : achat ? (
              <p className="m-0 text-[14px] text-muted">
                {achat.type === "ressource" ? "Ressource" : "Service"} ·{" "}
                {achat.titre} · <b className="text-ink">{achat.somme}</b>.{" "}
                {achat.type === "ressource"
                  ? "Elle s’ouvre dès le paiement confirmé."
                  : "L’équipe vous écrit dès le paiement confirmé."}
              </p>
            ) : (
              <p className="m-0 text-[14px] text-muted">
                Cotisation annuelle
                {cotisation?.formule ? ` · ${cotisation.formule}` : ""} ·{" "}
                <b className="text-ink">{cotisation?.somme}</b>. Votre espace
                s’ouvre dès le paiement confirmé.
              </p>
            )}

            {modes.length ? (
              <form
                action={
                  facture
                    ? ouvrirReglement
                    : achat
                      ? reglerAchat
                      : reglerCotisation
                }
                className="mt-4"
              >
                {facture ? (
                  <input type="hidden" name="factureId" value={facture.id} />
                ) : achat ? (
                  <>
                    <input type="hidden" name="achat" value={achat.type} />
                    <input type="hidden" name="cible" value={achat.id} />
                  </>
                ) : null}
                <GrilleMoyens modes={modes} bientot={bientot} />
              </form>
            ) : (
              <p className="m-0 mt-4 rounded-[var(--radius-m)] border border-line bg-surface-2 px-4 py-3.5 text-[14px] text-muted">
                Aucun moyen de paiement n’est encore configuré. Écrivez à
                l’équipe : elle vous indiquera comment régler.
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
