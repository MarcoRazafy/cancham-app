"use client";

import { useState } from "react";
import { ArrowRight, Check, Plus, X } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  CancelButton,
  Field,
  INPUT,
  ModalBody,
  ModalFooter,
  SubmitButton,
} from "@/components/form-bits";
import { ChampsCoordonnees } from "@/components/forms/EventForms";
import { inscriptionPublique } from "@/lib/actions/events";
import { fmtMoney } from "@/lib/format";

/** Représentants par inscription, au plus — comme pour un membre. */
const REPRESENTANTS_MAX = 10;

/**
 * Inscription à un événement depuis la vitrine, sans compte.
 *
 * Le même formulaire que celui des membres, mais tout se saisit : le nom de
 * l'entreprise, ceux des représentants — un champ chacun, « Ajouter un
 * représentant » en ouvre un autre —, puis les coordonnées. Le paiement,
 * s'il y en a un, vient en dernier.
 */
export function InscriptionPublique({
  event,
}: {
  event: {
    id: string;
    titre: string;
    lieu: string;
    payant: boolean;
    prix: number;
    restantes: number;
  };
}) {
  const max = Math.min(REPRESENTANTS_MAX, event.restantes);
  // Des clés stables : retirer un champ ne décale pas la saisie des autres.
  const [lignes, setLignes] = useState([0]);
  const [suivante, setSuivante] = useState(1);

  return (
    <Modal
      title="Inscription à l’événement"
      trigger={(ouvrir) => (
        <button type="button" onClick={ouvrir} className="btn-action w-full">
          S’inscrire <ArrowRight size={16} />
        </button>
      )}
    >
      {(fermer) => (
        <form action={inscriptionPublique}>
          <input type="hidden" name="eventId" value={event.id} />
          <ModalBody>
            <div>
              <div className="font-semibold text-[15px]">{event.titre}</div>
              <div className="text-[12.5px] text-muted">
                {event.lieu} · {event.restantes} place
                {event.restantes > 1 ? "s" : ""} restante
                {event.restantes > 1 ? "s" : ""}
              </div>
            </div>

            <Field label="Nom de l’entreprise">
              <input
                type="text"
                name="entreprise"
                required
                maxLength={120}
                autoComplete="organization"
                placeholder="Votre entreprise — N/A à titre personnel"
                className={INPUT}
              />
            </Field>

            <div>
              <span className="block text-[12.8px] font-semibold text-ink mb-1.5">
                Nom du représentant{" "}
                <span className="font-normal text-muted">
                  (vous pouvez en ajouter plusieurs)
                </span>
              </span>
              <div className="flex flex-col gap-2">
                {lignes.map((cle, i) => (
                  <div key={cle} className="flex gap-2">
                    <input
                      type="text"
                      name="representant"
                      required={i === 0}
                      maxLength={80}
                      autoComplete={i === 0 ? "name" : "off"}
                      placeholder={
                        i === 0 ? "Prénom et nom" : "Prénom et nom d’un autre"
                      }
                      aria-label={`Représentant ${i + 1}`}
                      className={INPUT}
                    />
                    {i > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setLignes((l) => l.filter((c) => c !== cle))
                        }
                        aria-label={`Retirer le représentant ${i + 1}`}
                        className="shrink-0 w-[42px] rounded-[var(--radius-s)] border border-line text-muted hover:text-ink hover:bg-surface-2 flex items-center justify-center cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              {lignes.length < max ? (
                <button
                  type="button"
                  onClick={() => {
                    setLignes((l) => [...l, suivante]);
                    setSuivante((n) => n + 1);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 text-[12.8px] font-semibold text-accent bg-transparent border-0 p-0 cursor-pointer hover:underline"
                >
                  <Plus size={14} /> Ajouter un représentant
                </button>
              ) : null}
              <p className="m-0 mt-1.5 text-[12px] text-muted">
                {lignes.length > 1
                  ? `${lignes.length} personnes inscrites, chacune avec son QR code.`
                  : "Chaque personne inscrite reçoit son QR code."}
              </p>
            </div>

            <ChampsCoordonnees />

            {event.payant ? (
              <p className="text-[13px] text-warn bg-warn-soft rounded-[var(--radius-s)] px-3.5 py-3 m-0">
                <b>Événement payant · {fmtMoney(event.prix)} par personne</b>
                <br />À régler auprès de l’équipe CanCham avant l’événement.
              </p>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Inscription…">
              <Check size={14} /> Confirmer l’inscription
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
