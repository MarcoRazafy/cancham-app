"use client";

import { Check, Pencil } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  CancelButton,
  Field,
  INPUT,
  ModalBody,
  ModalFooter,
  SubmitButton,
} from "@/components/form-bits";
import { ChampImage } from "@/components/forms/MemberForms";
import { PAYS } from "@/components/public/ChoixFormule";
import { modifierMembreAdmin } from "@/lib/actions/members";
import {
  FORMULES,
  ORDRE_FORMULES,
  fmtCotisation,
  libelleFormule,
} from "@/lib/membership";
import type { Member } from "@/lib/types";

function Rubrique({ children }: { children: React.ReactNode }) {
  return (
    <div className="surtitre text-faint pt-2 border-t border-line first:border-t-0 first:pt-0">
      {children}
    </div>
  );
}

/**
 * Modification d'une fiche par l'équipe : identité, formule, présentation,
 * visuels. Tout est prérempli ; un champ d'image laissé vide garde l'image
 * actuelle.
 */
export function ModifierMembreButton({ membre: m }: { membre: Member }) {
  return (
    <Modal
      title={`Modifier la fiche · ${m.nom}`}
      wide
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          className="btn-contour btn-contour-sm text-ink hover:bg-surface-2"
        >
          <Pencil size={14} /> Modifier la fiche
        </button>
      )}
    >
      {(fermer) => (
        <form action={modifierMembreAdmin}>
          <input type="hidden" name="memberId" value={m.id} />
          <ModalBody>
            <Rubrique>Identité</Rubrique>
            <div className="grid gap-3.5 md:grid-cols-[1fr_200px]">
              <Field label="Nom de l’entreprise ou de la personne">
                <input
                  name="nom"
                  required
                  defaultValue={m.nom}
                  className={INPUT}
                />
              </Field>
              <Field label="Type de membre">
                <select name="type" defaultValue={m.type} className={INPUT}>
                  <option value="morale">Entreprise</option>
                  <option value="physique">Indépendant</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Secteur d’activité">
                <input
                  name="secteur"
                  defaultValue={m.secteur}
                  className={INPUT}
                />
              </Field>
              <Field label="Statut juridique">
                <input
                  name="statutJuridique"
                  defaultValue={m.statutJuridique ?? ""}
                  placeholder="SARL, SA, association…"
                  className={INPUT}
                />
              </Field>
              <Field label="Ville">
                <input name="ville" defaultValue={m.ville} className={INPUT} />
              </Field>
              <Field label="Pays d’implantation">
                <select
                  name="pays"
                  defaultValue={m.pays ?? ""}
                  className={INPUT}
                >
                  <option value="">Non précisé</option>
                  {/* Un pays saisi hors liste reste proposé : sans lui,
                      enregistrer la fiche l'effacerait. */}
                  {[
                    ...PAYS,
                    ...(m.pays && !(PAYS as readonly string[]).includes(m.pays)
                      ? [m.pays]
                      : []),
                  ].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Site web" hint="Avec ou sans « https:// ».">
              <input
                name="siteweb"
                defaultValue={m.siteweb ?? ""}
                placeholder="www.exemple.mg"
                className={INPUT}
              />
            </Field>

            <Rubrique>Adhésion</Rubrique>
            <Field
              label="Formule"
              hint="Fixe le montant des prochaines cotisations. Les factures déjà émises ne changent pas."
            >
              <select name="formule" defaultValue={m.formule} className={INPUT}>
                {ORDRE_FORMULES.map((f) => (
                  <option key={f} value={f}>
                    {libelleFormule(f)} — {fmtCotisation(f)}
                    {FORMULES[f].devise === "CAD" ? " (CAD)" : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Rubrique>Présentation</Rubrique>
            <Field label="Activité en une phrase">
              <input
                name="activite"
                defaultValue={m.activite}
                maxLength={160}
                className={INPUT}
              />
            </Field>
            <Field label="Description">
              <textarea
                name="desc"
                rows={4}
                defaultValue={m.desc}
                className={INPUT}
              />
            </Field>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Recherche actuellement">
                <textarea
                  name="besoins"
                  rows={3}
                  defaultValue={m.besoins ?? ""}
                  className={INPUT}
                />
              </Field>
              <Field label="Intérêts et synergies">
                <textarea
                  name="interets"
                  rows={3}
                  defaultValue={m.interets ?? ""}
                  className={INPUT}
                />
              </Field>
            </div>

            <Rubrique>Visuels</Rubrique>
            <div className="grid gap-3.5 md:grid-cols-3">
              <ChampImage
                name="logo"
                label="Logo"
                apercu={m.logo ?? null}
                ratio="aspect-[16/9]"
                contain
              />
              <ChampImage
                name="cover"
                label="Couverture"
                apercu={m.cover ?? null}
                ratio="aspect-[16/9]"
              />
              <ChampImage
                name="photo"
                label={m.type === "physique" ? "Portrait" : "Photo d’activité"}
                apercu={m.photo ?? null}
                ratio="aspect-[16/9]"
              />
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
