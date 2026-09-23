"use client";

import { CalendarX2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  CancelButton,
  FermerApresEnvoi,
  ModalBody,
  ModalFooter,
  SubmitButton,
} from "@/components/form-bits";
import { annulerRendezvous } from "@/lib/actions/rendezvous";

/**
 * Annulation d'un rendez-vous, avec une confirmation.
 *
 * Un clic de trop ne doit pas défaire une rencontre prévue : la boîte
 * rappelle quand elle a lieu, et dit à l'autre partie ce qui va se passer.
 */
export function AnnulerRendezvous({
  id,
  quand,
  retour,
  prevenu,
}: {
  id: string;
  /** « mercredi 30 septembre, 09 h 00 – 09 h 30 ». */
  quand: string;
  retour: string;
  /** Qui reçoit l'avis d'annulation. */
  prevenu: "le membre" | "l’équipe";
}) {
  return (
    <Modal
      title="Annuler le rendez-vous"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          className="inline-flex items-center gap-1.5 shrink-0 rounded-[var(--radius-s)] border border-line bg-transparent text-muted text-[12.4px] font-semibold px-[11px] py-1.5 cursor-pointer hover:text-bad hover:border-bad"
        >
          <CalendarX2 size={14} /> Annuler
        </button>
      )}
    >
      {(fermer) => (
        <form action={annulerRendezvous}>
          <input type="hidden" name="rendezvousId" value={id} />
          <input type="hidden" name="retour" value={retour} />
          <FermerApresEnvoi fermer={fermer} />
          <ModalBody>
            <p className="m-0 text-[14px]">
              Annuler le rendez-vous du <strong>{quand}</strong> ?
            </p>
            <p className="m-0 text-[13px] text-muted">
              Le créneau redevient libre aussitôt, et {prevenu} reçoit un
              courriel.
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton variant="danger" pendingLabel="Annulation…">
              <CalendarX2 size={14} /> Annuler le rendez-vous
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
