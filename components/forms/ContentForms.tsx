"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Pencil,
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
  deleteService,
  deplacerService,
  downloadResource,
  postComment,
  saveService,
} from "@/lib/actions/content";
import type { CanchamService, Space } from "@/lib/types";

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

/* ============================ Services CanCham ============================ */

export function ServiceFormButton({ service }: { service?: CanchamService }) {
  const edition = !!service;
  return (
    <Modal
      title={edition ? "Modifier le service" : "Ajouter un service"}
      trigger={(ouvrir) =>
        edition ? (
          <button
            type="button"
            onClick={ouvrir}
            className="btn-contour btn-contour-sm text-ink hover:bg-surface-2"
          >
            <Pencil size={13} /> Modifier
          </button>
        ) : (
          <button
            type="button"
            onClick={ouvrir}
            className="btn-action btn-action-sm"
          >
            <Plus size={15} /> Nouveau service
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

export function DeleteServiceButton({
  serviceId,
  titre,
}: {
  serviceId: string;
  titre: string;
}) {
  return (
    <Modal
      title="Retirer le service"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          aria-label={`Retirer « ${titre} »`}
          title="Retirer"
          className="w-9 h-9 rounded-[var(--radius-s)] border border-line bg-surface flex items-center justify-center cursor-pointer text-muted hover:text-accent hover:border-accent"
        >
          <Trash2 size={15} />
        </button>
      )}
    >
      {(fermer) => (
        <form action={deleteService}>
          <input type="hidden" name="serviceId" value={serviceId} />
          <ModalBody>
            <p className="m-0 text-[13.6px] text-muted">
              « <b className="text-ink">{titre}</b> » ne sera plus proposé aux
              membres.
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton variant="danger" pendingLabel="Retrait…">
              <Trash2 size={14} /> Retirer
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/** Monter ou descendre un service dans sa liste. */
export function DeplacerServiceButton({
  serviceId,
  sens,
  desactive,
}: {
  serviceId: string;
  sens: "haut" | "bas";
  desactive: boolean;
}) {
  return (
    <form action={deplacerService}>
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="sens" value={sens} />
      <SubmitButton
        sm
        variant="line"
        disabled={desactive}
        aria-label={sens === "haut" ? "Monter" : "Descendre"}
        title={sens === "haut" ? "Monter" : "Descendre"}
        className="!px-2 disabled:opacity-35"
      >
        {sens === "haut" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
      </SubmitButton>
    </form>
  );
}
