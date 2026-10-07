"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Check,
  Folder,
  FolderLock,
  FolderPlus,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  CancelButton,
  Field,
  INPUT,
  ModalBody,
  ModalFooter,
  SubmitButton,
} from "@/components/form-bits";
import { Card } from "@/components/ui";
import type { MembreChoisissable } from "@/components/forms/BibliothequeOutils";
import { ChoixEntreprises } from "@/components/forms/ChoixEntreprises";
import {
  creerDossier,
  deplacerDossier,
  reglerAccesDossier,
  renommerDossier,
  supprimerDossier,
} from "@/lib/actions/content";
import type { DossierRessource, Space } from "@/lib/types";

/** Les dossiers proposés dans une liste déroulante, décalés selon leur rang. */
export type Arborescence = { id: string; nom: string; profondeur: number }[];

const decalage = (n: number) => `${"  ".repeat(n)}${n ? "└ " : ""}`;

/**
 * Qui voit un dossier : tous les membres, ou les entreprises que l'équipe
 * coche une à une. Le choix part avec le formulaire qui l'entoure (`acces`,
 * puis un `membre` par entreprise).
 */
function ChampAccesDossier({
  membres,
  restreint = false,
  acces = [],
}: {
  membres: MembreChoisissable[];
  /** L'état actuel du dossier, quand on le règle. */
  restreint?: boolean;
  acces?: string[];
}) {
  const [personnalise, setPersonnalise] = useState(restreint);
  return (
    <>
      <Field
        label="Accès"
        hint={
          personnalise
            ? undefined
            : "Tous les membres à jour voient ce dossier."
        }
      >
        <select
          name="acces"
          value={personnalise ? "personnalise" : "tous"}
          onChange={(e) => setPersonnalise(e.target.value === "personnalise")}
          className={INPUT}
        >
          <option value="tous">Tous les membres</option>
          <option value="personnalise">
            Personnalisé — entreprises choisies
          </option>
        </select>
      </Field>
      {personnalise ? (
        <ChoixEntreprises membres={membres} initiales={acces} />
      ) : null}
    </>
  );
}

/** Nouveau dossier, dans celui qui est ouvert. */
export function BoutonNouveauDossier({
  parentId,
  membres,
}: {
  parentId: string | null;
  /** Les entreprises à qui l'on peut réserver le dossier. */
  membres: MembreChoisissable[];
}) {
  return (
    <Modal
      title="Nouveau dossier"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          className="btn-contour btn-contour-sm"
        >
          <FolderPlus size={15} /> Nouveau dossier
        </button>
      )}
    >
      {(fermer) => (
        <form action={creerDossier}>
          {parentId ? (
            <input type="hidden" name="parent" value={parentId} />
          ) : null}
          <ModalBody>
            <Field
              label="Nom du dossier"
              hint={
                parentId
                  ? "Il sera rangé dans le dossier ouvert."
                  : "Il sera rangé à la racine de la bibliothèque."
              }
            >
              <input
                name="nom"
                required
                maxLength={80}
                autoFocus
                placeholder="Ex. Missions économiques"
                className={INPUT}
              />
            </Field>
            <ChampAccesDossier membres={membres} />
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Création…">
              <FolderPlus size={15} /> Créer le dossier
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/**
 * Un dossier de la bibliothèque.
 *
 * La carte entière ouvre le dossier ; les commandes de l'équipe sont posées
 * à côté du lien, et non dedans — un lien ne contient pas de bouton.
 */
export function CarteDossier({
  dossier: d,
  space,
  admin,
  arborescence,
  membres,
}: {
  dossier: DossierRessource;
  space: Space;
  admin: boolean;
  arborescence: Arborescence;
  /** Les entreprises à qui l'on peut réserver le dossier. Équipe seulement. */
  membres: MembreChoisissable[];
}) {
  const contenu = [
    d.dossiers ? `${d.dossiers} dossier${d.dossiers > 1 ? "s" : ""}` : null,
    d.ressources
      ? `${d.ressources} ressource${d.ressources > 1 ? "s" : ""}`
      : null,
  ].filter(Boolean);
  // Un dossier réservé le dit : à l'équipe, pour combien d'entreprises ; au
  // membre qui le voit, que c'est pour la sienne.
  const reserve = !d.restreint
    ? null
    : admin
      ? `Réservé à ${d.acces.length} entreprise${d.acces.length > 1 ? "s" : ""}`
      : "Réservé à votre entreprise";

  return (
    <Card className="flex items-center gap-3 p-3.5 transition-shadow hover:shadow-[0_12px_28px_-20px_rgba(15,29,44,0.45)]">
      <Link
        href={`/${space}/ressources?dossier=${d.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 no-underline"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-s)] bg-surface-2 text-accent">
          {d.restreint ? <FolderLock size={18} /> : <Folder size={18} />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14.5px] font-semibold text-ink">
            {d.nom}
          </span>
          <span className="block text-[12.3px] text-muted">
            {contenu.length ? contenu.join(" · ") : "Vide"}
          </span>
          {reserve ? (
            <span className="block text-[11.8px] font-semibold text-warn">
              {reserve}
            </span>
          ) : null}
        </span>
      </Link>

      {admin ? (
        <div className="flex shrink-0 items-center gap-1">
          <AccesDossier dossier={d} membres={membres} />
          <ReglagesDossier dossier={d} arborescence={arborescence} />
          <SupprimerDossier dossier={d} />
        </div>
      ) : null}
    </Card>
  );
}

const BTN_ICONE =
  "flex h-8 w-8 items-center justify-center rounded-[var(--radius-s)] border border-line bg-surface text-muted cursor-pointer";

/**
 * Qui voit le dossier : tous les membres, ou les entreprises cochées. Dans
 * sa propre fenêtre, à part du nom et du rangement : c'est une autre
 * décision, et la liste des entreprises prend de la place.
 */
function AccesDossier({
  dossier: d,
  membres,
}: {
  dossier: DossierRessource;
  membres: MembreChoisissable[];
}) {
  return (
    <Modal
      title="Qui voit ce dossier"
      largeur="max-w-[620px]"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          aria-label={`Qui voit « ${d.nom} »`}
          title="Qui voit ce dossier"
          className={`${BTN_ICONE} hover:border-faint hover:text-ink ${d.restreint ? "border-warn text-warn" : ""}`}
        >
          <Users size={14} />
        </button>
      )}
    >
      {(fermer) => (
        <form action={reglerAccesDossier}>
          <input type="hidden" name="dossierId" value={d.id} />
          <ModalBody>
            <p className="m-0 text-[13.4px] text-muted">
              <b className="text-ink">{d.nom}</b> — l’accès vaut pour tout ce
              que le dossier contient : ses ressources et ses sous-dossiers.
            </p>
            <ChampAccesDossier
              membres={membres}
              restreint={d.restreint}
              acces={d.acces}
            />
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Enregistrement…">
              <Check size={15} /> Enregistrer l’accès
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/** Renommer, et ranger ailleurs : les deux se font dans la même fenêtre. */
function ReglagesDossier({
  dossier: d,
  arborescence,
}: {
  dossier: DossierRessource;
  arborescence: Arborescence;
}) {
  return (
    <Modal
      title="Réglages du dossier"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          aria-label={`Réglages de « ${d.nom} »`}
          title="Renommer ou déplacer"
          className={`${BTN_ICONE} hover:border-faint hover:text-ink`}
        >
          <Pencil size={14} />
        </button>
      )}
    >
      {(fermer) => (
        <>
          <form action={renommerDossier}>
            <input type="hidden" name="dossierId" value={d.id} />
            <ModalBody>
              <Field label="Nom">
                <input
                  name="nom"
                  required
                  maxLength={80}
                  defaultValue={d.nom}
                  className={INPUT}
                />
              </Field>
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={fermer} />
              <SubmitButton sm pendingLabel="Enregistrement…">
                Renommer
              </SubmitButton>
            </ModalFooter>
          </form>

          <form action={deplacerDossier} className="border-t border-line">
            <input type="hidden" name="dossierId" value={d.id} />
            <ModalBody>
              <Field
                label="Ranger dans"
                hint="Un dossier ne peut pas être rangé dans lui-même."
              >
                <select
                  name="parent"
                  defaultValue={d.parentId ?? ""}
                  className={INPUT}
                >
                  <option value="">Racine de la bibliothèque</option>
                  {arborescence
                    .filter((x) => x.id !== d.id)
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {decalage(x.profondeur)}
                        {x.nom}
                      </option>
                    ))}
                </select>
              </Field>
            </ModalBody>
            <ModalFooter>
              <SubmitButton sm variant="line" pendingLabel="Déplacement…">
                Déplacer
              </SubmitButton>
            </ModalFooter>
          </form>
        </>
      )}
    </Modal>
  );
}

function SupprimerDossier({ dossier: d }: { dossier: DossierRessource }) {
  const contenu = d.dossiers + d.ressources;
  return (
    <Modal
      title="Supprimer le dossier"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          aria-label={`Supprimer « ${d.nom} »`}
          title="Supprimer"
          className={`${BTN_ICONE} hover:border-accent hover:text-accent`}
        >
          <Trash2 size={14} />
        </button>
      )}
    >
      {(fermer) => (
        <form action={supprimerDossier}>
          <input type="hidden" name="dossierId" value={d.id} />
          <ModalBody>
            <p className="m-0 text-[13.8px] text-muted">
              Le dossier <b className="text-ink">{d.nom}</b> sera supprimé.
              {contenu ? (
                <>
                  {" "}
                  Ce qu’il contient — {contenu} élément
                  {contenu > 1 ? "s" : ""} — remonte d’un niveau. Aucun document
                  n’est effacé.
                </>
              ) : (
                " Il est vide."
              )}
              {d.restreint && contenu ? (
                <>
                  {" "}
                  <b className="text-ink">Ce dossier est réservé</b> : une fois
                  remonté, son contenu suit l’accès du dossier qui le reçoit.
                </>
              ) : null}
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
