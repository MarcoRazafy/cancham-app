"use client";

import {
  Check,
  Download,
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
  createNews,
  createOffer,
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

/* ============================ Actualités ============================ */

export function NewNewsButton() {
  return (
    <Modal
      wide
      title="Nouvelle actualité"
      trigger={(ouvrir) => (
        <button
          onClick={ouvrir}
          className={`${BTN_PRIMARY} text-[13.4px] px-[15px] py-[9px]`}
        >
          <Plus size={15} /> Nouvelle actualité
        </button>
      )}
    >
      {(fermer) => (
        <form action={createNews}>
          <ModalBody>
            <Field label="Titre">
              <input
                type="text"
                name="titre"
                required
                placeholder="Ex. Nouvelle mission économique 2027"
                className={INPUT}
              />
            </Field>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Catégorie">
                <select
                  name="cat"
                  className={INPUT}
                  defaultValue="Vie de la chambre"
                >
                  <option>Programmation</option>
                  <option>Événement passé</option>
                  <option>Vie de la chambre</option>
                  <option>Formation</option>
                </select>
              </Field>
              <Field label="Type de média">
                <select name="mediaType" className={INPUT} defaultValue="image">
                  <option value="image">Photo</option>
                  <option value="video">Vidéo</option>
                </select>
              </Field>
            </div>
            <Field label="Résumé" hint="Affiché dans le fil d’actualité.">
              <textarea
                name="extrait"
                rows={3}
                placeholder="Résumé court…"
                className={INPUT}
              />
            </Field>
            <Field label="Texte complet">
              <textarea
                name="corps"
                rows={6}
                placeholder="Texte intégral de l’article…"
                className={INPUT}
              />
            </Field>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Publication…">
              <Check size={14} /> Publier l’actualité
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

export function NewOfferButton({
  membres,
}: {
  membres: { id: string; nom: string }[];
}) {
  return (
    <Modal
      title="Ajouter une offre en vedette"
      trigger={(ouvrir) => (
        <button
          onClick={ouvrir}
          aria-label="Ajouter une offre"
          className="border border-line bg-surface w-7 h-7 rounded-[var(--radius-s)] flex items-center justify-center cursor-pointer text-muted hover:text-ink"
        >
          <Plus size={14} />
        </button>
      )}
    >
      {(fermer) => (
        <form action={createOffer}>
          <ModalBody>
            <Field label="Membre">
              <select name="memberId" className={INPUT}>
                {membres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Titre de l’offre">
              <input
                type="text"
                name="titre"
                required
                placeholder="Ex. -15% sur les circuits Andasibe en octobre"
                className={INPUT}
              />
            </Field>
            <Field label="Description courte">
              <textarea
                name="desc"
                rows={3}
                placeholder="Détail de l’offre…"
                className={INPUT}
              />
            </Field>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Publication…">
              Publier l’offre
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

/* ============================ Commentaires ============================ */

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
        {payant ? (
          <>
            <ShoppingCart size={13} /> Acheter
          </>
        ) : (
          <>
            <Download size={13} /> {video ? "Regarder" : "Télécharger"}
          </>
        )}
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
