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
  saveEvent,
  toggleAttendance,
} from "@/lib/actions/events";
import { fmtMoney } from "@/lib/format";
import type { CanchamEvent } from "@/lib/types";

const BTN_PRIMARY = "btn-action btn-action-sm";
const BTN_LINE =
  "inline-flex items-center gap-[7px] rounded-[var(--radius-s)] font-semibold cursor-pointer border border-line bg-transparent text-ink hover:bg-surface-2";

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

export function EventFormButton({ event }: { event?: CanchamEvent }) {
  const edition = !!event;
  return (
    <Modal
      wide
      title={edition ? "Modifier l’événement" : "Créer un événement"}
      trigger={(ouvrir) =>
        edition ? (
          <button
            onClick={ouvrir}
            className={`${BTN_LINE} text-[12.4px] px-[11px] py-1.5`}
          >
            Modifier
          </button>
        ) : (
          <button
            onClick={ouvrir}
            className={`${BTN_PRIMARY} text-[13.4px] px-[15px] py-[9px]`}
          >
            <Plus size={15} /> Créer un événement
          </button>
        )
      }
    >
      {(fermer) => (
        <form action={saveEvent}>
          {event ? (
            <input type="hidden" name="eventId" value={event.id} />
          ) : null}
          <ModalBody>
            <Field label="Titre">
              <input
                type="text"
                name="titre"
                required
                defaultValue={event?.titre}
                placeholder="Ex. Atelier Doing Business in Canada"
                className={INPUT}
              />
            </Field>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Date">
                <input
                  type="date"
                  name="date"
                  defaultValue={event?.date ?? "2026-12-01"}
                  className={INPUT}
                />
              </Field>
              <Field label="Format">
                <select
                  name="format"
                  className={INPUT}
                  defaultValue={event?.format ?? "Présentiel"}
                >
                  <option>Présentiel</option>
                  <option>Webinaire</option>
                  <option>Hybride</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Lieu">
                <input
                  type="text"
                  name="lieu"
                  defaultValue={event?.lieu}
                  placeholder="Antananarivo"
                  className={INPUT}
                />
              </Field>
              <Field label="Capacité">
                <input
                  type="number"
                  name="cap"
                  min={1}
                  defaultValue={event?.cap ?? 80}
                  className={INPUT}
                />
              </Field>
            </div>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Type">
                <select
                  name="type"
                  className={INPUT}
                  defaultValue={event?.payant ? "payant" : "gratuit"}
                >
                  <option value="gratuit">Gratuit</option>
                  <option value="payant">Payant</option>
                </select>
              </Field>
              <Field
                label="Tarif (Ariary)"
                hint="Ignoré si l’événement est gratuit."
              >
                <input
                  type="number"
                  name="prix"
                  min={0}
                  defaultValue={event?.prix || 50000}
                  className={INPUT}
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea
                name="desc"
                rows={4}
                defaultValue={event?.desc}
                placeholder="Présentation courte pour les membres…"
                className={INPUT}
              />
            </Field>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Enregistrement…">
              <Check size={14} />{" "}
              {edition ? "Enregistrer" : "Publier l’événement"}
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

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
}: {
  attendeeId: string;
  eventId: string;
  statut: string;
}) {
  const label =
    statut === "présent"
      ? "Marquer absent"
      : statut === "absent"
        ? "Marquer présent"
        : "Enregistrer l’arrivée";
  return (
    <form action={toggleAttendance}>
      <input type="hidden" name="attendeeId" value={attendeeId} />
      <input type="hidden" name="eventId" value={eventId} />
      <SubmitButton sm variant="ghost" pendingLabel="…">
        {label}
      </SubmitButton>
    </form>
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
