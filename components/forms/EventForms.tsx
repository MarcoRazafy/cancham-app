"use client";

import { Check, LogIn, Plus, Trash2, UserPlus, X } from "lucide-react";
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
  addAttendee,
  cancelRegistration,
  deleteEvent,
  registerForEvent,
  retirerParticipant,
  toggleAttendance,
} from "@/lib/actions/events";
import { fmtMoney } from "@/lib/format";
import type { CanchamEvent } from "@/lib/types";

const BTN_PRIMARY = "btn-action btn-action-sm";

/* ============================ Côté membre ============================ */

export function RegisterButton({
  event,
  nom,
  email,
  tel,
  libelle = "S’inscrire",
}: {
  event: CanchamEvent;
  nom: string;
  email: string;
  tel?: string;
  /** Intitulé du bouton déclencheur — « M’inscrire » sur la vue d'ensemble. */
  libelle?: string;
}) {
  return (
    <Modal
      title="Inscription à l’événement"
      trigger={(ouvrir) => (
        <button
          onClick={ouvrir}
          className={`${BTN_PRIMARY} justify-center text-[13.4px] px-[18px] py-[10px]`}
        >
          {libelle}
        </button>
      )}
    >
      {(fermer) => (
        <form action={registerForEvent}>
          <input type="hidden" name="eventId" value={event.id} />
          <ModalBody>
            <div>
              <div className="font-semibold text-[15px]">{event.titre}</div>
              <div className="text-[12.5px] text-muted">
                {event.lieu} · {event.cap - event.inscrits} place
                {event.cap - event.inscrits > 1 ? "s" : ""} restante
                {event.cap - event.inscrits > 1 ? "s" : ""}
              </div>
            </div>
            <Field label="Personne présente">
              <input
                type="text"
                name="nom"
                defaultValue={nom}
                required
                className={INPUT}
              />
            </Field>
            <Field label="Courriel de confirmation">
              <input
                type="email"
                name="email"
                defaultValue={email}
                className={INPUT}
              />
            </Field>
            <Field label="Téléphone">
              <input
                type="tel"
                name="tel"
                defaultValue={tel ?? ""}
                className={INPUT}
              />
            </Field>
            {event.payant ? (
              <p className="text-[13px] text-warn bg-warn-soft rounded-[var(--radius-s)] px-3.5 py-3 m-0">
                <b>Événement payant · {fmtMoney(event.prix)}</b>
                <br />
                Une facture sera générée à l’inscription, réglable auprès de
                l’équipe.
              </p>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Inscription…">
              <Check size={14} /> Confirmer mon inscription
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

export function CancelRegistrationButton({ eventId }: { eventId: string }) {
  return (
    <form action={cancelRegistration}>
      <input type="hidden" name="eventId" value={eventId} />
      <SubmitButton
        sm
        variant="ghost"
        pendingLabel="Annulation…"
        className="text-bad w-full justify-center"
      >
        <X size={13} /> Annuler mon inscription
      </SubmitButton>
    </form>
  );
}

/* ============================ Côté admin ============================ */

export function DeleteEventButton({
  eventId,
  titre,
}: {
  eventId: string;
  titre: string;
}) {
  return (
    <Modal
      title="Supprimer l’événement"
      trigger={(ouvrir) => (
        <button
          onClick={ouvrir}
          className="inline-flex items-center gap-[7px] rounded-[var(--radius-s)] font-semibold cursor-pointer border border-transparent bg-transparent text-bad hover:bg-surface-2 text-[12.4px] px-[11px] py-1.5"
        >
          <Trash2 size={13} /> Supprimer
        </button>
      )}
    >
      {(fermer) => (
        <form action={deleteEvent}>
          <input type="hidden" name="eventId" value={eventId} />
          <ModalBody>
            <p className="text-[13.6px] text-muted m-0">
              « <b className="text-ink">{titre}</b> » sera supprimé avec ses
              inscriptions et sa liste de présence. L’opération est consignée au
              journal.
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton variant="danger" pendingLabel="Suppression…">
              <Trash2 size={14} /> Supprimer
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/** Pointage à l'accueil. */
export function AttendanceButton({
  attendeeId,
  eventId,
  statut,
  onglet,
}: {
  attendeeId: string;
  eventId: string;
  statut: "confirme" | "present" | "absent";
  /** Onglet de la liste où revenir après le pointage. */
  onglet?: string;
}) {
  const present = statut === "present";
  return (
    <form action={toggleAttendance}>
      <input type="hidden" name="attendeeId" value={attendeeId} />
      <input type="hidden" name="eventId" value={eventId} />
      {onglet ? <input type="hidden" name="onglet" value={onglet} /> : null}
      <SubmitButton
        sm
        variant={present ? "ghost" : "line"}
        pendingLabel="…"
        className="whitespace-nowrap"
      >
        {present ? (
          "Marquer absent"
        ) : (
          <>
            <Check size={13} />{" "}
            {statut === "absent" ? "Marquer présent" : "Arrivée"}
          </>
        )}
      </SubmitButton>
    </form>
  );
}

/** Retrait d'une personne de la liste d'accueil, après confirmation. */
export function RetirerParticipantButton({
  attendeeId,
  eventId,
  nom,
  onglet,
}: {
  attendeeId: string;
  eventId: string;
  nom: string;
  onglet?: string;
}) {
  return (
    <Modal
      title="Retirer de la liste"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          aria-label={`Retirer ${nom}`}
          title="Retirer de la liste"
          className="w-8 h-8 rounded-[var(--radius-s)] border border-transparent bg-transparent text-faint flex items-center justify-center cursor-pointer hover:text-accent hover:border-line"
        >
          <Trash2 size={14} />
        </button>
      )}
    >
      {(fermer) => (
        <form action={retirerParticipant}>
          <input type="hidden" name="attendeeId" value={attendeeId} />
          <input type="hidden" name="eventId" value={eventId} />
          {onglet ? <input type="hidden" name="onglet" value={onglet} /> : null}
          <ModalBody>
            <p className="text-[13.6px] text-muted m-0">
              Retirer <b className="text-ink">{nom}</b> de la liste d’accueil ?
              Une inscription faite depuis l’espace membre reste enregistrée
              côté membre.
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton variant="danger" pendingLabel="Retrait…">
              <Trash2 size={14} /> Retirer
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

export function AddAttendeeButton({
  eventId,
  membres,
}: {
  eventId: string;
  membres: { id: string; nom: string; contact: string; email: string }[];
}) {
  return (
    <Modal
      title="Inscrire quelqu’un"
      trigger={(ouvrir) => (
        <button
          onClick={ouvrir}
          className={`${BTN_PRIMARY} text-[12.4px] px-[11px] py-1.5`}
        >
          <UserPlus size={14} /> Inscrire quelqu’un
        </button>
      )}
    >
      {(fermer) => (
        <form action={addAttendee}>
          <input type="hidden" name="eventId" value={eventId} />
          <ModalBody>
            <Field label="Nom">
              <input
                type="text"
                name="nom"
                required
                placeholder="Nom complet"
                className={INPUT}
              />
            </Field>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Entreprise">
                <input
                  type="text"
                  name="entreprise"
                  list="membres-connus"
                  placeholder="Ex. Participant individuel"
                  className={INPUT}
                />
                <datalist id="membres-connus">
                  {membres.map((m) => (
                    <option key={m.id} value={m.nom} />
                  ))}
                </datalist>
              </Field>
              <Field label="Courriel">
                <input
                  type="email"
                  name="email"
                  placeholder="contact@exemple.mg"
                  className={INPUT}
                />
              </Field>
            </div>
            <p className="text-[12px] text-faint m-0">
              Pour une personne qui se présente sans inscription préalable,
              utilisez « Arrivée directe » : elle est enregistrée comme présente
              immédiatement.
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton
              name="direct"
              value="1"
              variant="line"
              pendingLabel="…"
            >
              <LogIn size={14} /> Arrivée directe
            </SubmitButton>
            <SubmitButton pendingLabel="Inscription…">
              <Plus size={14} /> Inscrire
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
