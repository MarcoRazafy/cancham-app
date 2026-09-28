"use client";

import { CreditCard, Smartphone } from "lucide-react";
import { Modal } from "@/components/Modal";
import { CancelButton, ModalBody, ModalFooter } from "@/components/form-bits";
import { payerEnLigne } from "@/lib/actions/paiements";

/**
 * Régler une facture de cotisation en ligne.
 *
 * Deux moyens, deux boutons d'envoi du même formulaire : la carte bancaire
 * et les portefeuilles mobiles malgaches. Le choix part avec la requête, et
 * le membre file ensuite chez le prestataire — sa carte ne passe jamais par
 * nos serveurs.
 */
export function PaiementEnLigne({
  factureId,
  numero,
  montant,
}: {
  factureId: string;
  numero: string;
  montant: string;
}) {
  return (
    <Modal
      title="Régler en ligne"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-accent cursor-pointer bg-transparent border-0 p-0 hover:underline"
        >
          <CreditCard size={13} /> Régler en ligne
        </button>
      )}
    >
      {(fermer) => (
        <form action={payerEnLigne}>
          <input type="hidden" name="factureId" value={factureId} />
          <ModalBody>
            <p className="m-0 text-[13.6px] text-muted">
              Facture{" "}
              <span className="font-[family-name:var(--font-mono)] text-ink">
                {numero}
              </span>{" "}
              · <b className="text-ink">{montant}</b>
            </p>

            <Moyen
              mode="international"
              icone={<CreditCard size={17} />}
              titre="Carte bancaire"
              detail="Visa, Mastercard — y compris une carte émise à l’étranger."
            />
            <Moyen
              mode="mobile_money"
              icone={<Smartphone size={17} />}
              titre="Mobile money"
              detail="MVola, Orange Money, Airtel Money."
            />

            <p className="m-0 text-[12.4px] text-faint">
              Le paiement se fait sur la page sécurisée de notre prestataire.
              Votre facture est marquée réglée dès sa confirmation.
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/** Un moyen de paiement : le bouton porte le mode qui part avec le formulaire. */
function Moyen({
  mode,
  icone,
  titre,
  detail,
}: {
  mode: string;
  icone: React.ReactNode;
  titre: string;
  detail: string;
}) {
  return (
    <button
      type="submit"
      name="mode"
      value={mode}
      className="flex w-full items-center gap-3.5 rounded-[var(--radius-m)] border border-line bg-surface px-4 py-3.5 text-left cursor-pointer transition-colors hover:border-accent hover:bg-surface-2"
    >
      <span className="shrink-0 text-accent">{icone}</span>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-ink">
          {titre}
        </span>
        <span className="block text-[12.5px] text-muted">{detail}</span>
      </span>
    </button>
  );
}
