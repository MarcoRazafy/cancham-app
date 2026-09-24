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
  enregistrerTypeRendezvous,
  supprimerTypeRendezvous,
} from "@/lib/actions/rendezvous";
import { enMinutes, estHeure } from "@/lib/agenda";
import { JOURS_SEMAINE } from "@/lib/rendezvous";
import type { TypeRendezvous } from "@/lib/rendezvous-donnees";

/**
 * Réglages des rendez-vous, côté équipe.
 *
 * Un type porte ses propres heures d'accueil : c'est le couple durée +
 * plages qui donne des créneaux, et il se règle donc d'un seul geste. Un
 * entretien d'une heure peut ainsi demander une matinée dégagée, là où un
 * point rapide se glisse en fin de journée.
 */

/** Une plage en cours de saisie. */
interface Ligne {
  jour: number;
  debut: string;
  fin: string;
}

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
  const [duree, setDuree] = useState(type?.duree ?? 30);
  // Un type neuf arrive avec une matinée : plus rapide à corriger qu'à créer.
  const [plages, setPlages] = useState<Ligne[]>(
    type?.plages.length
      ? type.plages.map((p) => ({ jour: p.jour, debut: p.debut, fin: p.fin }))
      : [{ jour: 1, debut: "09:00", fin: "12:00" }],
  );

  const changer = (i: number, champ: keyof Ligne, valeur: string | number) =>
    setPlages((l) =>
      l.map((p, n) => (n === i ? { ...p, [champ]: valeur } : p)),
    );

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
      {/* Les plages partent en JSON : le formulaire en ajoute et en retire. */}
      <input type="hidden" name="plages" value={JSON.stringify(plages)} />
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
          hint="Elle découpe les heures d’accueil en créneaux."
        >
          <input
            type="number"
            name="duree"
            required
            min={10}
            max={240}
            step={5}
            value={duree}
            onChange={(e) => setDuree(Number(e.target.value))}
            className={INPUT}
          />
        </Field>

        {/* ==================== Heures d'accueil ==================== */}
        <div>
          <span className="block text-[12.3px] font-semibold text-muted mb-1.5">
            Heures d’accueil pour ce rendez-vous
          </span>
          <div className="flex flex-col gap-2">
            {plages.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  aria-label="Jour de la semaine"
                  value={p.jour}
                  onChange={(e) => changer(i, "jour", Number(e.target.value))}
                  className={`${INPUT} flex-1 min-w-0`}
                >
                  {JOURS_SEMAINE.map((j) => (
                    <option key={j.cle} value={j.cle}>
                      {j.libelle}
                    </option>
                  ))}
                </select>
                <div className="w-[104px] shrink-0">
                  <input
                    type="time"
                    aria-label="Début"
                    value={p.debut}
                    onChange={(e) => changer(i, "debut", e.target.value)}
                    className={INPUT}
                  />
                </div>
                <span aria-hidden className="text-muted text-[13px]">
                  –
                </span>
                <div className="w-[104px] shrink-0">
                  <input
                    type="time"
                    aria-label="Fin"
                    value={p.fin}
                    onChange={(e) => changer(i, "fin", e.target.value)}
                    className={INPUT}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setPlages((l) => l.filter((_, n) => n !== i))}
                  aria-label="Retirer cette plage"
                  title="Retirer"
                  className="w-8 h-8 shrink-0 rounded-[var(--radius-s)] border border-line bg-surface text-muted hover:text-bad hover:border-bad flex items-center justify-center cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap mt-2">
            <button
              type="button"
              onClick={() =>
                setPlages((l) => [
                  ...l,
                  { jour: l.at(-1)?.jour ?? 1, debut: "14:00", fin: "16:00" },
                ])
              }
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent bg-transparent border-0 p-0 cursor-pointer hover:underline"
            >
              <Plus size={14} /> Ajouter une plage
            </button>
            <span className="text-[11.5px] text-faint">
              {resume(plages, duree)}
            </span>
          </div>

          {plages.length ? null : (
            <p className="m-0 mt-2 text-[12px] text-warn">
              Sans heure d’accueil, ce rendez-vous n’a aucun créneau à proposer
              — les membres ne le verront pas.
            </p>
          )}
        </div>

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

/** « 14 créneaux de 30 min par semaine » : ce que les réglages donnent. */
function resume(plages: Ligne[], duree: number): string {
  if (!duree || duree <= 0) return "";
  const total = plages.reduce((n, p) => {
    if (!estHeure(p.debut) || !estHeure(p.fin)) return n;
    const minutes = enMinutes(p.fin) - enMinutes(p.debut);
    return n + (minutes > 0 ? Math.floor(minutes / duree) : 0);
  }, 0);
  return total
    ? `${total} créneau${total > 1 ? "x" : ""} de ${duree} min par semaine`
    : "aucun créneau";
}
