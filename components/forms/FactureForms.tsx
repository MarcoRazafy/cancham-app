"use client";

import { useState } from "react";
import { Check, FilePlus2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  CancelButton,
  Field,
  INPUT,
  ModalBody,
  ModalFooter,
  SubmitButton,
} from "@/components/form-bits";
import { creerFacture, marquerFacturePayee } from "@/lib/actions/factures";
import type { Devise } from "@/lib/membership";

const MODES = ["Espèces", "Virement bancaire", "Mobile Money", "Chèque"];

const aujourdhui = () => new Date().toISOString().slice(0, 10);

/** Nouvelle facture : stand, participation, prestation, cotisation hors cycle. */
export function NouvelleFactureButton({
  membres,
}: {
  /** La devise suit la formule du membre, modifiable au besoin. */
  membres: { id: string; nom: string; devise: Devise }[];
}) {
  const [devise, setDevise] = useState<Devise>(membres[0]?.devise ?? "MGA");
  const [payee, setPayee] = useState(false);

  return (
    <Modal
      title="Nouvelle facture"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          className="btn-action btn-action-sm"
        >
          <FilePlus2 size={15} /> Nouvelle facture
        </button>
      )}
    >
      {(fermer) => (
        <form action={creerFacture}>
          <ModalBody>
            <Field label="Membre facturé">
              <select
                name="memberId"
                required
                className={INPUT}
                onChange={(e) =>
                  setDevise(
                    membres.find((m) => m.id === e.target.value)?.devise ??
                      "MGA",
                  )
                }
              >
                {membres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Objet"
              hint="Une facture dont l’objet commence par « Cotisation » remet le membre à jour une fois réglée."
            >
              <input
                name="objet"
                required
                placeholder="Ex. Stand — Canada Expo Tamatave"
                className={INPUT}
              />
            </Field>
            <div className="grid gap-3.5 grid-cols-[1fr_130px]">
              <Field label="Montant">
                <input
                  type="number"
                  name="montant"
                  min={1}
                  step={1}
                  required
                  className={INPUT}
                />
              </Field>
              <Field label="Devise">
                <select
                  name="devise"
                  value={devise}
                  onChange={(e) => setDevise(e.target.value as Devise)}
                  className={INPUT}
                >
                  <option value="MGA">Ariary</option>
                  <option value="CAD">Dollars CA</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Date">
                <input
                  type="date"
                  name="date"
                  defaultValue={aujourdhui()}
                  className={INPUT}
                />
              </Field>
              <Field label="Situation">
                <select
                  name="statut"
                  value={payee ? "payee" : "envoyee"}
                  onChange={(e) => setPayee(e.target.value === "payee")}
                  className={INPUT}
                >
                  <option value="envoyee">À régler</option>
                  <option value="payee">Déjà réglée</option>
                </select>
              </Field>
            </div>
            {payee ? (
              <Field label="Mode de paiement">
                <select name="mode" className={INPUT} defaultValue="Espèces">
                  {MODES.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Émission…">
              <Check size={14} /> Émettre la facture
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/** Enregistre le règlement d'une facture émise. */
export function MarquerPayeeButton({
  factureId,
  numero,
  montant,
  cotisation,
}: {
  factureId: string;
  numero: string;
  montant: string;
  /** Une cotisation réglée remet le membre à jour : on le dit avant. */
  cotisation: boolean;
}) {
  return (
    <Modal
      title={`Régler la facture ${numero}`}
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          className="btn-action btn-action-sm"
        >
          <Check size={15} /> Marquer comme payée
        </button>
      )}
    >
      {(fermer) => (
        <form action={marquerFacturePayee}>
          <input type="hidden" name="factureId" value={factureId} />
          <ModalBody>
            <p className="m-0 text-[13.6px] text-muted">
              Règlement de <b className="text-ink">{montant}</b>.
              {cotisation
                ? " C’est une cotisation : le membre repassera à jour."
                : ""}
            </p>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Mode de paiement">
                <select name="mode" className={INPUT} defaultValue="Espèces">
                  {MODES.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>
              <Field label="Date du règlement">
                <input
                  type="date"
                  name="date"
                  defaultValue={aujourdhui()}
                  className={INPUT}
                />
              </Field>
            </div>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Enregistrement…">
              <Check size={14} /> Confirmer le règlement
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
