"use client";

import Link from "next/link";
import { Folder, FolderPlus, Pencil, Trash2 } from "lucide-react";
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
import {
  creerDossier,
  deplacerDossier,
  renommerDossier,
  supprimerDossier,
} from "@/lib/actions/content";
import type { DossierRessource, Space } from "@/lib/types";

/** Les dossiers proposés dans une liste déroulante, décalés selon leur rang. */
export type Arborescence = { id: string; nom: string; profondeur: number }[];

const decalage = (n: number) => `${"  ".repeat(n)}${n ? "└ " : ""}`;

/** Nouveau dossier, dans celui qui est ouvert. */
export function BoutonNouveauDossier({
  parentId,
}: {
  parentId: string | null;
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
}: {
  dossier: DossierRessource;
  space: Space;
  admin: boolean;
  arborescence: Arborescence;
}) {
  const contenu = [
    d.dossiers ? `${d.dossiers} dossier${d.dossiers > 1 ? "s" : ""}` : null,
    d.ressources
      ? `${d.ressources} ressource${d.ressources > 1 ? "s" : ""}`
      : null,
  ].filter(Boolean);

  return (
    <Card className="flex items-center gap-3 p-3.5 transition-shadow hover:shadow-[0_12px_28px_-20px_rgba(15,29,44,0.45)]">
      <Link
        href={`/${space}/ressources?dossier=${d.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 no-underline"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-s)] bg-surface-2 text-accent">
          <Folder size={18} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14.5px] font-semibold text-ink">
            {d.nom}
          </span>
          <span className="block text-[12.3px] text-muted">
            {contenu.length ? contenu.join(" · ") : "Vide"}
          </span>
        </span>
      </Link>

      {admin ? (
        <div className="flex shrink-0 items-center gap-1">
          <ReglagesDossier dossier={d} arborescence={arborescence} />
          <SupprimerDossier dossier={d} />
        </div>
      ) : null}
    </Card>
  );
}

const BTN_ICONE =
  "flex h-8 w-8 items-center justify-center rounded-[var(--radius-s)] border border-line bg-surface text-muted cursor-pointer";

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
