"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  CancelButton,
  FermerApresEnvoi,
  Field,
  INPUT,
  ModalBody,
  ModalFooter,
  SubmitButton,
} from "@/components/form-bits";
import {
  ajouterPlage,
  enregistrerTypeRendezvous,
  supprimerPlage,
  supprimerTypeRendezvous,
} from "@/lib/actions/rendezvous";
import { JOURS_SEMAINE } from "@/lib/rendezvous";
import type { TypeRendezvous } from "@/lib/rendezvous-donnees";

/**
 * Réglages des rendez-vous, côté équipe : ce qu'elle propose, et quand elle
 * reçoit.
 *
 * Les deux se tiennent : un type sans plage d'accueil ne donne aucun créneau,
 * et une plage sans type n'a rien à offrir. La page le dit ; ces boîtes de
 * dialogue ne font que saisir.
 */

/* ============================ Types ============================ */

export function NouveauType() {
  return (
    <Modal
      title="Nouveau type de rendez-vous"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          className="btn-action btn-action-sm"
        >
          <Plus size={15} /> Nouveau type
        </button>
      )}
    >
      {(fermer) => <FormulaireType fermer={fermer} />}
    </Modal>
  );
}

export function ModifierType({ type }: { type: TypeRendezvous }) {
  return (
    <Modal
      title="Modifier le type de rendez-vous"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          aria-label={`Modifier « ${type.titre} »`}
          title="Modifier"
          className="w-8 h-8 shrink-0 rounded-[var(--radius-s)] border border-line bg-surface text-muted hover:text-ink hover:bg-surface-2 flex items-center justify-center cursor-pointer"
        >
          <Pencil size={14} />
        </button>
      )}
    >
      {(fermer) => <FormulaireType type={type} fermer={fermer} />}
    </Modal>
  );
}

function FormulaireType({
  type,
  fermer,
}: {
  type?: TypeRendezvous;
  fermer: () => void;
}) {
  const [confirmer, setConfirmer] = useState(false);

  if (confirmer && type) {
    return (
      <form action={supprimerTypeRendezvous}>
        <input type="hidden" name="typeId" value={type.id} />
        <FermerApresEnvoi fermer={fermer} />
        <ModalBody>
          <p className="m-0 text-[14px]">
            Retirer <strong>« {type.titre} »</strong> des rendez-vous proposés ?
          </p>
          <p className="m-0 text-[13px] text-muted">
            Des rendez-vous déjà pris s’y rattachent peut-être : dans ce cas il
            est masqué plutôt que supprimé, et leur historique reste lisible.
          </p>
        </ModalBody>
        <ModalFooter>
          <CancelButton onClick={() => setConfirmer(false)} />
          <SubmitButton variant="danger" pendingLabel="Retrait…">
            <Trash2 size={14} /> Retirer
          </SubmitButton>
        </ModalFooter>
      </form>
    );
  }

  return (
    <form action={enregistrerTypeRendezvous}>
      {type ? <input type="hidden" name="typeId" value={type.id} /> : null}
      <FermerApresEnvoi fermer={fermer} />
      <ModalBody>
        <Field label="Titre">
          <input
            name="titre"
            required
            maxLength={80}
            defaultValue={type?.titre}
            placeholder="Ex. Entretien d’accompagnement"
            className={INPUT}
          />
        </Field>
        <Field
          label="Précision"
          hint="Facultatif : ce que le membre lit sous le titre."
        >
          <input
            name="detail"
            maxLength={200}
            defaultValue={type?.detail ?? ""}
            placeholder="Ex. Un point sur votre projet d’export"
            className={INPUT}
          />
        </Field>
        <Field
          label="Durée (minutes)"
          hint="Elle découpe les plages d’accueil en créneaux."
        >
          <input
            type="number"
            name="duree"
            required
            min={10}
            max={240}
            step={5}
            defaultValue={type?.duree ?? 30}
            className={INPUT}
          />
        </Field>
        <label className="flex items-center gap-2.5 text-[13.4px] cursor-pointer w-fit">
          <input
            type="checkbox"
            name="actif"
            value="1"
            defaultChecked={type?.actif ?? true}
            className="w-4 h-4 accent-[var(--accent)]"
          />
          Proposé aux membres
        </label>
      </ModalBody>
      <ModalFooter>
        {type ? (
          <button
            type="button"
            onClick={() => setConfirmer(true)}
            className="mr-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-bad bg-transparent border-0 cursor-pointer hover:underline"
          >
            <Trash2 size={14} /> Retirer
          </button>
        ) : null}
        <CancelButton onClick={fermer} />
        <SubmitButton pendingLabel="Enregistrement…">
          {type ? "Enregistrer" : "Ajouter"}
        </SubmitButton>
      </ModalFooter>
    </form>
  );
}

/* ============================ Plages ============================ */

export function NouvellePlage({ jour }: { jour?: number }) {
  return (
    <Modal
      title="Ouvrir une plage d’accueil"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-s)] border border-line bg-surface text-ink text-[12.4px] font-semibold px-[11px] py-1.5 cursor-pointer hover:bg-surface-2"
        >
          <Plus size={14} /> Ouvrir une plage
        </button>
      )}
    >
      {(fermer) => (
        <form action={ajouterPlage}>
          <FermerApresEnvoi fermer={fermer} />
          <ModalBody>
            <Field label="Jour de la semaine">
              <select
                name="jour"
                required
                defaultValue={jour ?? 1}
                className={INPUT}
              >
                {JOURS_SEMAINE.map((j) => (
                  <option key={j.cle} value={j.cle}>
                    {j.libelle}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-3.5 grid-cols-2">
              <Field label="De">
                <input
                  type="time"
                  name="debut"
                  required
                  defaultValue="09:00"
                  className={INPUT}
                />
              </Field>
              <Field label="À">
                <input
                  type="time"
                  name="fin"
                  required
                  defaultValue="12:00"
                  className={INPUT}
                />
              </Field>
            </div>
            <p className="m-0 text-[12.4px] text-muted">
              La plage revient chaque semaine, à l’heure de Madagascar. Une
              matinée et un après-midi se déclarent en deux plages.
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Ouverture…">Ouvrir</SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/** Fermeture d'une plage : un geste simple, sans boîte de dialogue. */
export function FermerPlage({ id, libelle }: { id: string; libelle: string }) {
  return (
    <form action={supprimerPlage}>
      <input type="hidden" name="plageId" value={id} />
      <SubmitButton
        variant="ghost"
        sm
        aria-label={`Fermer la plage ${libelle}`}
        title="Fermer cette plage"
        pendingLabel=""
        className="hover:text-bad!"
      >
        <Trash2 size={14} />
      </SubmitButton>
    </form>
  );
}
