"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ImagePlus,
  Plus,
  Trash2,
} from "lucide-react";
import { Field, INPUT, SubmitButton } from "@/components/form-bits";
import { Card } from "@/components/ui";
import { saveEvent } from "@/lib/actions/events";
import type { CanchamEvent, EtapeProgramme } from "@/lib/types";

interface Etape extends EtapeProgramme {
  /** Clé stable pour React, le temps de l'édition. */
  cle: number;
}

let prochaineCle = 1;
const nouvelleEtape = (e?: EtapeProgramme): Etape => ({
  cle: prochaineCle++,
  heure: e?.heure ?? "",
  titre: e?.titre ?? "",
  detail: e?.detail ?? "",
});

function Rubrique({
  titre,
  aide,
  children,
}: {
  titre: string;
  aide?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <h2 className="text-[17px] m-0">{titre}</h2>
      {aide ? <p className="text-[13px] text-muted m-0 mt-1">{aide}</p> : null}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </Card>
  );
}

/**
 * Formulaire complet d'un événement : ce que les membres verront sur sa
 * page — photo, horaires, public visé, programme étape par étape.
 */
export function FormulaireEvenement({ event }: { event?: CanchamEvent }) {
  const [payant, setPayant] = useState(event?.payant ?? false);
  const [etapes, setEtapes] = useState<Etape[]>(() =>
    event?.programme?.length
      ? event.programme.map(nouvelleEtape)
      : [nouvelleEtape()],
  );
  const [photoChoisie, setPhotoChoisie] = useState<string | null>(null);
  const [retirerPhoto, setRetirerPhoto] = useState(false);

  const deplacer = (i: number, sens: -1 | 1) =>
    setEtapes((l) => {
      const j = i + sens;
      if (j < 0 || j >= l.length) return l;
      const copie = [...l];
      [copie[i], copie[j]] = [copie[j], copie[i]];
      return copie;
    });

  const apercu = photoChoisie ?? (retirerPhoto ? null : (event?.photo ?? null));

  return (
    <form action={saveEvent} className="flex flex-col gap-4">
      {event ? <input type="hidden" name="eventId" value={event.id} /> : null}
      {retirerPhoto ? (
        <input type="hidden" name="retirerPhoto" value="1" />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px] items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <Rubrique titre="L’essentiel">
            <Field label="Titre">
              <input
                name="titre"
                required
                defaultValue={event?.titre}
                placeholder="Ex. Atelier Doing Business in Canada"
                className={INPUT}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Date">
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={event?.date}
                  className={INPUT}
                />
              </Field>
              <Field label="Horaires" hint="Ex. 17 h 30 – 20 h 00">
                <input
                  name="heure"
                  defaultValue={event?.heure ?? ""}
                  className={INPUT}
                />
              </Field>
              <Field label="Format">
                <select
                  name="format"
                  defaultValue={event?.format ?? "Présentiel"}
                  className={INPUT}
                >
                  <option>Présentiel</option>
                  <option>Webinaire</option>
                  <option>Hybride</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
              <Field label="Lieu" hint="Ville, salle, ou « En ligne ».">
                <input
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
                  required
                  defaultValue={event?.cap ?? 80}
                  className={INPUT}
                />
              </Field>
            </div>
          </Rubrique>

          <Rubrique
            titre="Présentation"
            aide="Un paragraphe par idée : laissez une ligne vide entre deux paragraphes."
          >
            <Field label="Description">
              <textarea
                name="desc"
                rows={7}
                defaultValue={event?.desc}
                placeholder="Ce que les participants vont vivre, apprendre, rencontrer…"
                className={INPUT}
              />
            </Field>
            <Field label="À qui s’adresse ce rendez-vous">
              <textarea
                name="pourQui"
                rows={3}
                defaultValue={event?.pourQui ?? ""}
                placeholder="Ex. Dirigeants de PME exportatrices, responsables commerciaux…"
                className={INPUT}
              />
            </Field>
          </Rubrique>

          <Rubrique
            titre="Programme"
            aide="Les étapes s’affichent dans cet ordre sur la page de l’événement. Une étape sans titre est ignorée."
          >
            <ol className="list-none m-0 p-0 flex flex-col gap-3">
              {etapes.map((e, i) => (
                <li
                  key={e.cle}
                  className="border border-line rounded-[var(--radius-m)] p-3.5 bg-surface-2"
                >
                  <div className="grid gap-3 sm:grid-cols-[120px_1fr_auto] items-end">
                    <Field label="Heure">
                      <input
                        name="etapeHeure"
                        defaultValue={e.heure}
                        placeholder="18 h 00"
                        className={INPUT}
                      />
                    </Field>
                    <Field label={`Étape ${i + 1}`}>
                      <input
                        name="etapeTitre"
                        defaultValue={e.titre}
                        placeholder="Ex. Tour de table express"
                        className={INPUT}
                      />
                    </Field>
                    <div className="flex gap-1 pb-0.5">
                      <BoutonIcone
                        libelle="Monter l’étape"
                        onClick={() => deplacer(i, -1)}
                        disabled={i === 0}
                      >
                        <ArrowUp size={15} />
                      </BoutonIcone>
                      <BoutonIcone
                        libelle="Descendre l’étape"
                        onClick={() => deplacer(i, 1)}
                        disabled={i === etapes.length - 1}
                      >
                        <ArrowDown size={15} />
                      </BoutonIcone>
                      <BoutonIcone
                        libelle="Retirer l’étape"
                        onClick={() =>
                          setEtapes((l) => l.filter((x) => x.cle !== e.cle))
                        }
                        danger
                      >
                        <Trash2 size={15} />
                      </BoutonIcone>
                    </div>
                  </div>
                  <div className="mt-3">
                    <input
                      name="etapeDetail"
                      defaultValue={e.detail ?? ""}
                      placeholder="Détail facultatif"
                      aria-label={`Détail de l’étape ${i + 1}`}
                      className={INPUT}
                    />
                  </div>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => setEtapes((l) => [...l, nouvelleEtape()])}
              className="self-start btn-contour btn-contour-sm text-ink hover:bg-surface-2"
            >
              <Plus size={14} /> Ajouter une étape
            </button>
          </Rubrique>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-[88px]">
          <Rubrique titre="Photo">
            <div className="aspect-[16/10] rounded-[var(--radius-m)] border border-line bg-surface-2 overflow-hidden flex items-center justify-center">
              {apercu ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={apercu}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[12.5px] text-faint">Aucune photo</span>
              )}
            </div>
            <label className="btn-contour btn-contour-sm text-ink hover:bg-surface-2 cursor-pointer justify-center">
              <ImagePlus size={14} />
              {apercu ? "Remplacer la photo" : "Choisir une photo"}
              <input
                type="file"
                name="photo"
                accept="image/*"
                className="sr-only"
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  setPhotoChoisie(f ? URL.createObjectURL(f) : null);
                  if (f) setRetirerPhoto(false);
                }}
              />
            </label>
            {event?.photo && !photoChoisie ? (
              <label className="flex items-center gap-2 text-[12.8px] text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={retirerPhoto}
                  onChange={(ev) => setRetirerPhoto(ev.target.checked)}
                />
                Retirer la photo actuelle
              </label>
            ) : null}
          </Rubrique>

          <Rubrique titre="Participation">
            <Field label="Accès">
              <select
                name="type"
                value={payant ? "payant" : "gratuit"}
                onChange={(ev) => setPayant(ev.target.value === "payant")}
                className={INPUT}
              >
                <option value="gratuit">Inclus dans l’adhésion</option>
                <option value="payant">Payant</option>
              </select>
            </Field>
            {payant ? (
              <Field
                label="Tarif (Ariary)"
                hint="Une facture est générée à chaque inscription."
              >
                <input
                  type="number"
                  name="prix"
                  min={1}
                  required
                  defaultValue={event?.prix || 50000}
                  className={INPUT}
                />
              </Field>
            ) : null}
          </Rubrique>

          <SubmitButton pendingLabel="Enregistrement…" className="w-full">
            <Check size={15} />{" "}
            {event ? "Enregistrer les modifications" : "Publier l’événement"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}

function BoutonIcone({
  libelle,
  onClick,
  disabled = false,
  danger = false,
  children,
}: {
  libelle: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={libelle}
      title={libelle}
      className={`w-9 h-9 rounded-[var(--radius-s)] border border-line bg-surface flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
        danger
          ? "text-muted hover:text-accent hover:border-accent"
          : "text-muted hover:text-ink hover:border-faint"
      }`}
    >
      {children}
    </button>
  );
}
