"use client";

import { Trash2, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  CancelButton,
  Field,
  INPUT,
  ModalBody,
  ModalFooter,
  SubmitButton,
} from "@/components/form-bits";
import { supprimerMonCompte } from "@/lib/actions/compte";

/**
 * Supprimer son propre compte, depuis son profil.
 *
 * Le clic n'efface rien : il ouvre une alerte rouge qui dit ce qui disparaît,
 * ce qui reste, et demande le mot de passe. C'est la dernière chose que voit
 * la personne avant un départ sans retour.
 */
export function SupprimerMonCompteButton({
  espace,
  nom,
  email,
  entreprise,
}: {
  espace: "membre" | "admin";
  nom: string;
  email: string;
  /** Entreprise du membre, nommée dans l'alerte. */
  entreprise?: string | null;
}) {
  return (
    <Modal
      title="Supprimer mon compte"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          className="w-full justify-center inline-flex items-center gap-[7px] rounded-[var(--radius-s)] font-semibold cursor-pointer border border-bad-soft bg-transparent text-bad hover:bg-bad-soft text-[12.8px] px-3 py-2"
        >
          <Trash2 size={14} /> Supprimer mon compte
        </button>
      )}
    >
      {(fermer) => (
        <form action={supprimerMonCompte}>
          <input type="hidden" name="espace" value={espace} />
          <ModalBody>
            <div
              role="alert"
              className="flex gap-3 rounded-[var(--radius-s)] border border-bad-soft bg-bad-soft text-bad px-4 py-3.5"
            >
              <TriangleAlert size={20} className="shrink-0 mt-0.5" />
              <p className="m-0 text-[13.4px] leading-relaxed">
                <b className="block mb-1">
                  Cette suppression est définitive : on ne peut pas revenir en
                  arrière.
                </b>
                Le compte <b>{nom}</b> ({email}) sera supprimé, et vous serez
                déconnecté immédiatement.
              </p>
            </div>

            <ul className="list-none m-0 p-0 mt-4 flex flex-col gap-2 text-[13.2px] text-muted">
              <li>
                <b className="text-ink">Ce qui disparaît</b> — votre accès, vos
                commentaires, vos « j’aime » et vos rappels d’agenda.
              </li>
              <li>
                <b className="text-ink">Ce qui reste</b> —{" "}
                {espace === "membre"
                  ? `la fiche de ${entreprise ?? "votre entreprise"}, ses factures et ses inscriptions, ainsi que vos échanges avec l’équipe.`
                  : "vos messages dans les conversations, et vos actions au journal d’activité, à votre nom."}
              </li>
            </ul>

            <div className="mt-4">
              <Field
                label="Votre mot de passe"
                hint="Pour confirmer que c’est bien vous."
              >
                <input
                  type="password"
                  name="motDePasse"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={INPUT}
                />
              </Field>
            </div>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton variant="danger" pendingLabel="Suppression…">
              <Trash2 size={14} /> Supprimer définitivement mon compte
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
