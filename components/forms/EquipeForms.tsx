"use client";

import { ArrowLeftRight, Send, ShieldCheck, ShieldOff } from "lucide-react";
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
  changerNiveauEquipe,
  creerCompteEquipe,
  promouvoirAdmin,
  retirerAdmin,
} from "@/lib/actions/equipe";
import { NIVEAU_EQUIPE_LABEL } from "@/lib/enums";
import type { NiveauEquipe } from "@/lib/types";

const DROITS: Record<NiveauEquipe, string> = {
  administrateur:
    "Contrôle total, y compris ouvrir et retirer les accès de l’équipe.",
  manager: "Tout le back-office, sauf la gestion de l’équipe.",
};

/**
 * Le niveau d'accès, en deux cartes à cocher. Manager par défaut : on
 * n'accorde le contrôle total qu'en le choisissant.
 */
function ChoixNiveau({ defaut = "manager" }: { defaut?: NiveauEquipe }) {
  return (
    <fieldset className="m-0 p-0 border-0 min-w-0">
      <legend className="text-[12.8px] font-semibold text-ink mb-1.5 p-0">
        Rôle
      </legend>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {(["administrateur", "manager"] as const).map((n) => (
          <label
            key={n}
            className="flex gap-2.5 items-start rounded-[var(--radius-s)] border border-line bg-surface px-3.5 py-3 cursor-pointer hover:border-faint has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
          >
            <input
              type="radio"
              name="niveau"
              value={n}
              defaultChecked={n === defaut}
              className="mt-0.5 w-4 h-4 accent-[var(--accent)] cursor-pointer shrink-0"
            />
            <span>
              <span className="block text-[13.4px] font-semibold text-ink">
                {NIVEAU_EQUIPE_LABEL[n]}
              </span>
              <span className="block text-[12.3px] text-muted mt-0.5">
                {DROITS[n]}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Ouvrir un compte à un membre de l'équipe : son adresse, sa fonction et son
 * rôle. Il reçoit par e-mail son identifiant et un mot de passe provisoire.
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
      <ChoixNiveau />
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
      title="Ajouter à l’équipe"
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
            <p className="text-[13.6px] text-muted m-0 mb-4">
              <b className="text-ink">{nom}</b> ({email}) aura accès au
              back-office : membres, paiements, événements, messagerie et
              journal d’activité.
            </p>
            <ChoixNiveau />
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
      title="Retirer l’accès à l’équipe"
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

/** Passer un compte d'équipe d'administrateur à manager, ou l'inverse. */
export function ChangerNiveauButton({
  userId,
  nom,
  niveau,
}: {
  userId: string;
  nom: string;
  niveau: NiveauEquipe;
}) {
  const cible: NiveauEquipe =
    niveau === "administrateur" ? "manager" : "administrateur";
  const libelle = NIVEAU_EQUIPE_LABEL[cible].toLowerCase();
  return (
    <Modal
      title={`Passer en ${libelle}`}
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          className="btn-contour btn-contour-sm text-ink hover:bg-surface-2"
        >
          <ArrowLeftRight size={14} /> Passer en {libelle}
        </button>
      )}
    >
      {(fermer) => (
        <form action={changerNiveauEquipe}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="niveau" value={cible} />
          <ModalBody>
            <p className="text-[13.6px] text-muted m-0">
              <b className="text-ink">{nom}</b> devient {libelle} :{" "}
              {DROITS[cible].charAt(0).toLowerCase() + DROITS[cible].slice(1)}
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Enregistrement…">
              <ArrowLeftRight size={14} /> Passer en {libelle}
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
