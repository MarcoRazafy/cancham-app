"use client";

import { Send, ShieldCheck, ShieldOff } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  CancelButton,
  Field,
  INPUT,
  ModalBody,
  ModalFooter,
  SubmitButton,
} from "@/components/form-bits";
import {
  creerCompteEquipe,
  promouvoirAdmin,
  retirerAdmin,
} from "@/lib/actions/equipe";

/**
 * Ouvrir un compte à un membre de l'équipe : son adresse et sa fonction.
 * Il reçoit par e-mail son identifiant et un mot de passe provisoire.
 */
export function FormulaireNouvelEquipier() {
  return (
    <form action={creerCompteEquipe} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Adresse e-mail">
          <input
            type="email"
            name="email"
            required
            autoComplete="off"
            placeholder="prenom@cancham.mg"
            className={INPUT}
          />
        </Field>
        <Field label="Fonction">
          <input
            name="fonction"
            required
            maxLength={80}
            placeholder="Ex. Chargée des adhésions"
            className={INPUT}
          />
        </Field>
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="m-0 text-[12.5px] text-muted max-w-[46ch]">
          Un e-mail lui envoie son identifiant et un mot de passe provisoire, à
          changer depuis « Mon profil ».
        </p>
        <SubmitButton pendingLabel="Création…">
          <Send size={14} /> Créer et envoyer les accès
        </SubmitButton>
      </div>
    </form>
  );
}

/**
 * Accorder et retirer l'accès au back-office.
 *
 * Les deux passent par une confirmation : donner l'accès ouvre tout — les
 * membres, les paiements, la messagerie —, le retirer ferme la porte à
 * quelqu'un qui travaille peut-être encore.
 */

export function PromouvoirButton({
  userId,
  nom,
  email,
  entreprise,
  ficheEffacable,
}: {
  userId: string;
  nom: string;
  email: string;
  /** Entreprise rattachée au compte, s'il y en a une. */
  entreprise?: string | null;
  /** Candidature vide : on peut proposer de supprimer la fiche au passage. */
  ficheEffacable?: boolean;
}) {
  return (
    <Modal
      title="Promouvoir en administrateur"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          className="btn-action btn-action-sm"
        >
          <ShieldCheck size={14} /> Promouvoir
        </button>
      )}
    >
      {(fermer) => (
        <form action={promouvoirAdmin}>
          <input type="hidden" name="userId" value={userId} />
          <ModalBody>
            <p className="text-[13.6px] text-muted m-0">
              <b className="text-ink">{nom}</b> ({email}) aura accès au
              back-office : membres, paiements, événements, messagerie et
              journal d’activité.
            </p>
            {ficheEffacable ? (
              <label className="flex gap-2.5 items-start mt-4 text-[13.4px] text-ink cursor-pointer">
                <input
                  type="checkbox"
                  name="supprimerFiche"
                  value="1"
                  defaultChecked
                  className="mt-0.5 w-4 h-4 accent-[var(--accent)] cursor-pointer"
                />
                <span>
                  Supprimer la candidature
                  {entreprise ? ` « ${entreprise} »` : ""} créée à son
                  inscription.
                  <span className="block text-[12.5px] text-muted mt-0.5">
                    Elle est vide : ni facture, ni inscription à un événement,
                    ni produit. Sans cela, elle resterait dans les demandes à
                    examiner.
                  </span>
                </span>
              </label>
            ) : entreprise ? (
              <p className="text-[12.8px] text-muted m-0 mt-3">
                Son compte reste rattaché à « {entreprise} » : la fiche de
                l’entreprise n’est pas touchée.
              </p>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Promotion…">
              <ShieldCheck size={14} /> Promouvoir
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

export function RetirerAdminButton({
  userId,
  nom,
  /** Le compte redeviendra membre s'il est rattaché à une entreprise. */
  entreprise,
}: {
  userId: string;
  nom: string;
  entreprise?: string | null;
}) {
  return (
    <Modal
      title="Retirer l’accès administrateur"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          className="btn-contour btn-contour-sm text-ink hover:bg-surface-2"
        >
          <ShieldOff size={14} /> Retirer l’accès
        </button>
      )}
    >
      {(fermer) => (
        <form action={retirerAdmin}>
          <input type="hidden" name="userId" value={userId} />
          <ModalBody>
            <p className="text-[13.6px] text-muted m-0">
              <b className="text-ink">{nom}</b> n’aura plus accès au
              back-office.{" "}
              {entreprise
                ? `Son compte redevient un compte membre de « ${entreprise} ».`
                : "Son compte est conservé, sans accès : ses messages et ses traces au journal restent lisibles."}
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton variant="danger" pendingLabel="Retrait…">
              <ShieldOff size={14} /> Retirer l’accès
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
