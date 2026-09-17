"use client";

import Link from "next/link";
import {
  BookOpen,
  Check,
  PlayCircle,
  Plus,
  Send,
  ShoppingCart,
  Trash2,
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
import {
  createResource,
  deleteResource,
  deleteService,
  downloadResource,
  postComment,
  saveService,
} from "@/lib/actions/content";
import type { CanchamService, Space } from "@/lib/types";

const BTN_PRIMARY = "btn-action btn-action-sm";
const BTN_LINE =
  "inline-flex items-center gap-[7px] rounded-[var(--radius-s)] font-semibold cursor-pointer border border-line bg-transparent text-ink hover:bg-surface-2";

export function CommentForm({
  space,
  retour,
  newsId,
  resourceId,
}: {
  space: Space;
  retour: string;
  newsId?: string;
  resourceId?: string;
}) {
  return (
    <form action={postComment} className="flex flex-col gap-2.5">
      <input type="hidden" name="space" value={space} />
      <input type="hidden" name="retour" value={retour} />
      {newsId ? <input type="hidden" name="newsId" value={newsId} /> : null}
      {resourceId ? (
        <input type="hidden" name="resourceId" value={resourceId} />
      ) : null}
      <textarea
        name="texte"
        rows={3}
        required
        placeholder="Ajouter un commentaire…"
        className={INPUT}
      />
      <SubmitButton sm pendingLabel="Publication…" className="self-start">
        <Send size={13} /> Publier le commentaire
      </SubmitButton>
    </form>
  );
}

/* ============================ Ressources ============================ */

export function NewResourceButton() {
  return (
    <Modal
      title="Ajouter une ressource"
      trigger={(ouvrir) => (
        <button
          onClick={ouvrir}
          className={`${BTN_PRIMARY} text-[13.4px] px-[15px] py-[9px]`}
        >
          <Plus size={15} /> Ajouter une ressource
        </button>
      )}
    >
      {(fermer) => (
        <form action={createResource}>
          <ModalBody>
            <Field label="Titre">
              <input
                type="text"
                name="titre"
                required
                placeholder="Ex. Guide export 2027"
                className={INPUT}
              />
            </Field>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Catégorie">
                <select name="cat" className={INPUT} defaultValue="Guide">
                  <option>Guide</option>
                  <option>Modèle</option>
                  <option>Formation</option>
                  <option>Rapport</option>
                </select>
              </Field>
              <Field label="Format">
                <select name="fmt" className={INPUT} defaultValue="PDF">
                  <option>PDF</option>
                  <option>DOCX</option>
                  <option>Vidéo</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field
                label="Taille ou durée"
                hint="Ex. 1,2 Mo — ou 48 min pour une vidéo."
              >
                <input
                  type="text"
                  name="taille"
                  placeholder="Ex. 1,2 Mo"
                  className={INPUT}
                />
              </Field>
              <Field
                label="Tarif (Ariary)"
                hint="Laissez à 0 pour une ressource gratuite."
              >
                <input
                  type="number"
                  name="prix"
                  defaultValue={0}
                  min={0}
                  className={INPUT}
                />
              </Field>
            </div>
            <Field label="Accès">
              <select name="type" className={INPUT} defaultValue="gratuit">
                <option value="gratuit">
                  Gratuit — inclus dans l’adhésion
                </option>
                <option value="payant">Payant — facturé en supplément</option>
              </select>
            </Field>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Ajout…">
              <Check size={14} /> Ajouter la ressource
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/**
 * Accès à une ressource depuis sa carte.
 *
 * Une ressource incluse s'ouvre dans le lecteur de la plateforme : il n'y a
 * plus de téléchargement, le contenu se consulte ici. Une ressource payante
 * garde « Acheter », qui consigne la demande — le paiement en ligne n'est pas
 * branché.
 */
export function DownloadResourceButton({
  resourceId,
  space,
  payant,
  video,
}: {
  resourceId: string;
  space: Space;
  payant: boolean;
  video: boolean;
}) {
  if (!payant) {
    return (
      <Link
        href={`/membre/ressources/${resourceId}`}
        className="w-full inline-flex items-center justify-center gap-[7px] rounded-[var(--radius-s)] font-semibold border border-line bg-transparent text-ink no-underline hover:border-faint hover:bg-surface-2 text-[12.4px] px-[11px] py-1.5"
      >
        {video ? <PlayCircle size={13} /> : <BookOpen size={13} />}
        {video ? "Regarder" : "Lire"}
      </Link>
    );
  }

  return (
    <form action={downloadResource} className="w-full">
      <input type="hidden" name="resourceId" value={resourceId} />
      <input type="hidden" name="space" value={space} />
      <SubmitButton
        sm
        variant="line"
        pendingLabel="…"
        className="w-full justify-center"
      >
        <ShoppingCart size={13} /> Acheter
      </SubmitButton>
    </form>
  );
}

export function DeleteResourceButton({ resourceId }: { resourceId: string }) {
  return (
    <form action={deleteResource}>
      <input type="hidden" name="resourceId" value={resourceId} />
      <SubmitButton sm variant="ghost" pendingLabel="…" className="text-bad">
        <Trash2 size={13} /> Retirer
      </SubmitButton>
    </form>
  );
}

/* ============================ Services CanCham ============================ */

export function ServiceFormButton({ service }: { service?: CanchamService }) {
  const edition = !!service;
  return (
    <Modal
      title={edition ? "Modifier le service" : "Ajouter un service"}
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
            <Plus size={15} /> Ajouter un service
          </button>
        )
      }
    >
      {(fermer) => (
        <form action={saveService}>
          {service ? (
            <input type="hidden" name="serviceId" value={service.id} />
          ) : null}
          <ModalBody>
            <Field label="Titre">
              <input
                type="text"
                name="titre"
                required
                defaultValue={service?.titre}
                placeholder="Ex. Accompagnement personnalisé à l’export"
                className={INPUT}
              />
            </Field>
            <Field label="Description">
              <textarea
                name="desc"
                rows={3}
                defaultValue={service?.desc}
                className={INPUT}
              />
            </Field>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Type">
                <select
                  name="type"
                  className={INPUT}
                  defaultValue={service?.type ?? "gratuit"}
                >
                  <option value="gratuit">Gratuit</option>
                  <option value="payant">Payant</option>
                </select>
              </Field>
              <Field
                label="Tarif (Ariary)"
                hint="Ignoré si le service est gratuit."
              >
                <input
                  type="number"
                  name="prix"
                  min={0}
                  defaultValue={service?.prix ?? 100000}
                  className={INPUT}
                />
              </Field>
            </div>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Enregistrement…">
              <Check size={14} />{" "}
              {edition ? "Enregistrer" : "Publier le service"}
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

export function DeleteServiceButton({ serviceId }: { serviceId: string }) {
  return (
    <form action={deleteService}>
      <input type="hidden" name="serviceId" value={serviceId} />
      <SubmitButton sm variant="ghost" pendingLabel="…" className="text-bad">
        <Trash2 size={13} /> Supprimer
      </SubmitButton>
    </form>
  );
}
