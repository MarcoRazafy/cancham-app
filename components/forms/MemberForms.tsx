"use client";

import { Bell, Check, CreditCard, Plus, Trash2, X } from "lucide-react";
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
  approveCandidature,
  createMember,
  deleteMember,
  registerPayment,
  rejectCandidature,
  sendReminder,
  updateMemberProfile,
} from "@/lib/actions/members";
import { fmtMoney } from "@/lib/format";

const BTN_PRIMARY = "btn-action btn-action-sm";
const BTN_LINE =
  "inline-flex items-center gap-[7px] rounded-[var(--radius-s)] font-semibold cursor-pointer border border-line bg-transparent text-ink hover:bg-surface-2";
const BTN_DANGER =
  "w-full justify-center inline-flex items-center gap-[7px] rounded-[var(--radius-s)] font-semibold cursor-pointer border border-bad-soft bg-transparent text-bad hover:bg-surface-2 text-[12.4px] px-[11px] py-1.5";

/** Ajout manuel d'un membre, côté back-office. */
export function AddMemberButton() {
  return (
    <Modal
      title="Ajouter un membre"
      trigger={(ouvrir) => (
        <button onClick={ouvrir} className={`${BTN_PRIMARY} text-[13.4px] px-[15px] py-[9px]`}>
          <Plus size={15} /> Ajouter un membre
        </button>
      )}
    >
      {(fermer) => (
        <form action={createMember}>
          <ModalBody>
            <Field label="Type de membre">
              <select name="type" className={INPUT} defaultValue="morale">
                <option value="morale">Entreprise (personne morale)</option>
                <option value="physique">Indépendant (personne physique)</option>
              </select>
            </Field>
            <Field
              label="Nom de l’entreprise"
              hint="Pour un indépendant, laissez vide pour reprendre le nom de la personne."
            >
              <input type="text" name="nom" placeholder="Ex. Zafy Design" className={INPUT} />
            </Field>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Secteur d’activité">
                <input type="text" name="secteur" placeholder="Ex. Artisanat & design" className={INPUT} />
              </Field>
              <Field label="Ville">
                <input type="text" name="ville" placeholder="Antananarivo" className={INPUT} />
              </Field>
            </div>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Représentant / contact clé">
                <input type="text" name="rep" placeholder="Nom complet" className={INPUT} />
              </Field>
              <Field label="Fonction">
                <input type="text" name="repTitre" placeholder="Ex. Directrice Générale" className={INPUT} />
              </Field>
            </div>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Courriel">
                <input type="email" name="email" placeholder="contact@entreprise.mg" className={INPUT} />
              </Field>
              <Field label="Téléphone">
                <input type="tel" name="tel" placeholder="+261 3…" className={INPUT} />
              </Field>
            </div>
            <Field label="Description">
              <textarea name="desc" rows={3} placeholder="Courte description de l’activité…" className={INPUT} />
            </Field>
            <Field label="Statut à la création">
              <select name="statut" className={INPUT} defaultValue="en_attente">
                <option value="a_jour">À jour (adhésion payée)</option>
                <option value="en_attente">En attente de paiement</option>
              </select>
            </Field>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Ajout…">
              <Plus size={14} /> Ajouter le membre
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/** Règlement encaissé par l'équipe : met à jour le statut et crée la facture. */
export function RegisterPaymentButton({
  memberId,
  premier,
  nom,
  montantParDefaut,
}: {
  memberId: string;
  premier: boolean;
  nom: string;
  montantParDefaut: number;
}) {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  return (
    <Modal
      title="Enregistrer le paiement"
      trigger={(ouvrir) => (
        <button onClick={ouvrir} className={`${BTN_PRIMARY} w-full justify-center text-[12.4px] px-[11px] py-1.5`}>
          <CreditCard size={14} />{" "}
          {premier ? "Enregistrer le paiement" : "Enregistrer un règlement"}
        </button>
      )}
    >
      {(fermer) => (
        <form action={registerPayment}>
          <input type="hidden" name="memberId" value={memberId} />
          <ModalBody>
            <p className="text-[13px] text-muted m-0">
              {premier
                ? `Confirmez le règlement de la cotisation pour activer l’accès complet de ${nom}.`
                : `Enregistrez un règlement pour ${nom}.`}
            </p>
            <Field label="Mode de paiement">
              <select name="mode" className={INPUT} defaultValue="Espèces">
                <option>Espèces</option>
                <option>Virement bancaire</option>
                <option>Chèque</option>
              </select>
            </Field>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Montant (Ariary)" hint={`Cotisation annuelle : ${fmtMoney(montantParDefaut)}`}>
                <input type="number" name="montant" defaultValue={montantParDefaut} className={INPUT} />
              </Field>
              <Field label="Date du paiement">
                <input type="date" name="date" defaultValue={aujourdhui} className={INPUT} />
              </Field>
            </div>
            <Field label="Note interne (optionnel)">
              <input type="text" name="note" placeholder="Ex. reçu remis en main propre" className={INPUT} />
            </Field>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Enregistrement…">
              <Check size={14} /> Confirmer le paiement
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

export function ApproveButton({ memberId }: { memberId: string }) {
  return (
    <form action={approveCandidature}>
      <input type="hidden" name="memberId" value={memberId} />
      <SubmitButton sm pendingLabel="Approbation…" className="w-full justify-center">
        <Check size={14} /> Approuver la demande
      </SubmitButton>
    </form>
  );
}

export function RejectButton({ memberId, nom }: { memberId: string; nom: string }) {
  return (
    <Modal
      title="Refuser la demande"
      trigger={(ouvrir) => (
        <button onClick={ouvrir} className={BTN_DANGER}>
          <X size={14} /> Refuser la demande
        </button>
      )}
    >
      {(fermer) => (
        <form action={rejectCandidature}>
          <input type="hidden" name="memberId" value={memberId} />
          <ModalBody>
            <p className="text-[13.6px] text-muted m-0">
              La candidature de <b className="text-ink">{nom}</b> sera supprimée. Le refus
              est consigné dans le journal, mais la fiche ne sera pas récupérable.
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton variant="danger" pendingLabel="Refus…">
              <X size={14} /> Refuser définitivement
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

export function ReminderButton({ memberId }: { memberId: string }) {
  return (
    <form action={sendReminder}>
      <input type="hidden" name="memberId" value={memberId} />
      <SubmitButton sm variant="line" pendingLabel="Envoi…" className="w-full justify-center">
        <Bell size={14} /> Envoyer une relance
      </SubmitButton>
    </form>
  );
}

export function DeleteMemberButton({ memberId, nom }: { memberId: string; nom: string }) {
  return (
    <Modal
      title="Supprimer ce membre"
      trigger={(ouvrir) => (
        <button onClick={ouvrir} className={BTN_DANGER}>
          <Trash2 size={14} /> Supprimer ce membre
        </button>
      )}
    >
      {(fermer) => (
        <form action={deleteMember}>
          <input type="hidden" name="memberId" value={memberId} />
          <ModalBody>
            <p className="text-[13.6px] text-muted m-0">
              <b className="text-ink">{nom}</b> sera retiré de l’annuaire avec ses produits,
              ses inscriptions et ses accès. Ses factures étant des pièces comptables, la
              suppression échoue s’il en existe — c’est voulu.
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton variant="danger" pendingLabel="Suppression…">
              <Trash2 size={14} /> Supprimer définitivement
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/** Édition de sa propre fiche par le membre. */
export function EditProfileButton({
  memberId,
  activite,
  desc,
  besoins,
  interets,
  produits,
}: {
  memberId: string;
  activite: string;
  desc: string;
  besoins?: string;
  interets?: string;
  produits: string[];
}) {
  return (
    <Modal
      wide
      title="Modifier ma fiche"
      trigger={(ouvrir) => (
        <button onClick={ouvrir} className={`${BTN_LINE} text-[12.4px] px-[11px] py-1.5`}>
          Modifier ma fiche
        </button>
      )}
    >
      {(fermer) => (
        <form action={updateMemberProfile}>
          <input type="hidden" name="memberId" value={memberId} />
          <ModalBody>
            <Field label="Activité (description courte)">
              <input type="text" name="activite" defaultValue={activite} className={INPUT} />
            </Field>
            <Field label="Description détaillée">
              <textarea name="desc" rows={4} defaultValue={desc} className={INPUT} />
            </Field>
            <Field
              label="Besoins actuels"
              hint="Ce que vous recherchez : partenaires, distributeurs, financement…"
            >
              <textarea name="besoins" rows={2} defaultValue={besoins ?? ""} className={INPUT} />
            </Field>
            <Field label="Intérêts & synergies recherchées">
              <textarea name="interets" rows={2} defaultValue={interets ?? ""} className={INPUT} />
            </Field>
            <div className="grid gap-3.5 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Field key={i} label={`Produit / service ${i + 1}`}>
                  <input
                    type="text"
                    name={`produit${i}`}
                    defaultValue={produits[i] ?? ""}
                    placeholder="Nom du produit"
                    className={INPUT}
                  />
                </Field>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Enregistrement…">
              <Check size={14} /> Enregistrer
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
