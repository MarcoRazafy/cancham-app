"use client";

import { useState } from "react";
import { Check, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
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
  deleteNews,
  deleteOffer,
  enregistrerActualite,
  enregistrerOffre,
  supprimerCommentaire,
} from "@/lib/actions/content";
import type { NewsCategory, NewsItem, Offer } from "@/lib/types";

const CATEGORIES: NewsCategory[] = [
  "Vie de la chambre",
  "Programmation",
  "Événement passé",
  "Formation",
];

const BTN_ICONE =
  "w-9 h-9 rounded-[var(--radius-s)] border border-line bg-surface flex items-center justify-center cursor-pointer text-muted";

/* ============================ Actualités ============================ */

/** Rédaction d'une actualité, sur sa propre page. */
export function FormulaireActualite({ news }: { news?: NewsItem }) {
  const [imageChoisie, setImageChoisie] = useState<string | null>(null);
  const [retirerImage, setRetirerImage] = useState(false);
  const apercu = imageChoisie ?? (retirerImage ? null : (news?.image ?? null));

  return (
    <form
      action={enregistrerActualite}
      className="grid gap-4 lg:grid-cols-[1fr_340px] items-start"
    >
      {news ? <input type="hidden" name="newsId" value={news.id} /> : null}
      {retirerImage ? (
        <input type="hidden" name="retirerImage" value="1" />
      ) : null}

      <Card className="p-6 flex flex-col gap-4 min-w-0">
        <Field label="Titre">
          <input
            name="titre"
            required
            defaultValue={news?.titre}
            placeholder="Ex. Retour sur la Caravane de régionalisation"
            className={INPUT}
          />
        </Field>
        <Field
          label="Résumé"
          hint="Deux ou trois lignes : c’est ce qu’affiche le fil d’actualité."
        >
          <textarea
            name="extrait"
            required
            rows={3}
            defaultValue={news?.extrait}
            className={INPUT}
          />
        </Field>
        <Field
          label="Texte de l’article"
          hint="Les liens collés dans le texte deviennent cliquables."
        >
          <textarea
            name="corps"
            required
            rows={14}
            defaultValue={news?.corps}
            className={INPUT}
          />
        </Field>
      </Card>

      <div className="flex flex-col gap-4 lg:sticky lg:top-[88px]">
        <Card className="p-6 flex flex-col gap-4">
          <Field label="Catégorie">
            <select
              name="cat"
              defaultValue={news?.cat ?? "Vie de la chambre"}
              className={INPUT}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field
            label="Date de publication"
            hint="Classe l’actualité dans le fil."
          >
            <input
              type="date"
              name="date"
              defaultValue={news?.date ?? new Date().toISOString().slice(0, 10)}
              className={INPUT}
            />
          </Field>
        </Card>

        <Card className="p-6 flex flex-col gap-3">
          <span className="text-[12.3px] font-semibold text-muted">Photo</span>
          <div className="aspect-[16/9] rounded-[var(--radius-m)] border border-line bg-surface-2 overflow-hidden flex items-center justify-center">
            {apercu ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={apercu} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[12.5px] text-faint px-4 text-center">
                Sans photo, un bandeau aux couleurs de la chambre la remplace.
              </span>
            )}
          </div>
          <label className="btn-contour btn-contour-sm text-ink hover:bg-surface-2 cursor-pointer justify-center">
            <ImagePlus size={14} />
            {apercu ? "Remplacer la photo" : "Choisir une photo"}
            <input
              type="file"
              name="image"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setImageChoisie(f ? URL.createObjectURL(f) : null);
                if (f) setRetirerImage(false);
              }}
            />
          </label>
          {news?.image && !imageChoisie ? (
            <label className="flex items-center gap-2 text-[12.8px] text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={retirerImage}
                onChange={(e) => setRetirerImage(e.target.checked)}
              />
              Retirer la photo actuelle
            </label>
          ) : null}
        </Card>

        <SubmitButton pendingLabel="Publication…" className="w-full">
          <Check size={15} />{" "}
          {news ? "Enregistrer les modifications" : "Publier l’actualité"}
        </SubmitButton>
      </div>
    </form>
  );
}

export function SupprimerActualiteButton({
  newsId,
  titre,
  commentaires,
}: {
  newsId: string;
  titre: string;
  commentaires: number;
}) {
  return (
    <Modal
      title="Supprimer l’actualité"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          aria-label={`Supprimer « ${titre} »`}
          title="Supprimer"
          className={`${BTN_ICONE} hover:text-accent hover:border-accent`}
        >
          <Trash2 size={15} />
        </button>
      )}
    >
      {(fermer) => (
        <form action={deleteNews}>
          <input type="hidden" name="newsId" value={newsId} />
          <ModalBody>
            <p className="m-0 text-[13.6px] text-muted">
              « <b className="text-ink">{titre}</b> » disparaîtra du fil des
              membres
              {commentaires
                ? `, avec ses ${commentaires} commentaire${commentaires > 1 ? "s" : ""}`
                : ""}
              . L’opération est consignée au journal.
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

/** Retrait d'un commentaire par l'équipe. */
export function SupprimerCommentaireButton({
  commentId,
  auteur,
  retour,
}: {
  commentId: string;
  auteur: string;
  retour: string;
}) {
  return (
    <Modal
      title="Retirer le commentaire"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          aria-label={`Retirer le commentaire de ${auteur}`}
          title="Retirer le commentaire"
          className="w-7 h-7 rounded-md border border-transparent bg-transparent text-faint flex items-center justify-center cursor-pointer hover:text-accent hover:border-line"
        >
          <Trash2 size={13} />
        </button>
      )}
    >
      {(fermer) => (
        <form action={supprimerCommentaire}>
          <input type="hidden" name="commentId" value={commentId} />
          <input type="hidden" name="retour" value={retour} />
          <ModalBody>
            <p className="m-0 text-[13.6px] text-muted">
              Retirer le commentaire de <b className="text-ink">{auteur}</b> ?
              Son texte reste consultable au journal d’activité.
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

/* ============================ Offres des membres ============================ */

export function OffreButton({
  offre,
  membres,
}: {
  offre?: Offer;
  membres: { id: string; nom: string }[];
}) {
  return (
    <Modal
      title={offre ? "Modifier l’offre" : "Nouvelle offre de membre"}
      trigger={(ouvrir) =>
        offre ? (
          <button
            type="button"
            onClick={ouvrir}
            aria-label={`Modifier « ${offre.titre} »`}
            title="Modifier"
            className={`${BTN_ICONE} hover:text-ink hover:border-faint`}
          >
            <Pencil size={15} />
          </button>
        ) : (
          <button
            type="button"
            onClick={ouvrir}
            className="btn-action btn-action-sm"
          >
            <Plus size={15} /> Nouvelle offre
          </button>
        )
      }
    >
      {(fermer) => (
        <form action={enregistrerOffre}>
          {offre ? (
            <input type="hidden" name="offerId" value={offre.id} />
          ) : null}
          <ModalBody>
            <Field label="Membre qui propose l’offre">
              <select
                name="memberId"
                required
                defaultValue={offre?.membreId}
                className={INPUT}
              >
                {membres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Titre">
              <input
                name="titre"
                required
                defaultValue={offre?.titre}
                placeholder="Ex. -15 % sur l’audit énergétique"
                className={INPUT}
              />
            </Field>
            <Field
              label="Description"
              hint="Conditions, durée, comment en profiter."
            >
              <textarea
                name="desc"
                required
                rows={4}
                defaultValue={offre?.desc}
                className={INPUT}
              />
            </Field>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton pendingLabel="Enregistrement…">
              <Check size={14} /> {offre ? "Enregistrer" : "Publier l’offre"}
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

export function SupprimerOffreButton({
  offerId,
  titre,
}: {
  offerId: string;
  titre: string;
}) {
  return (
    <Modal
      title="Retirer l’offre"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          aria-label={`Retirer « ${titre} »`}
          title="Retirer"
          className={`${BTN_ICONE} hover:text-accent hover:border-accent`}
        >
          <Trash2 size={15} />
        </button>
      )}
    >
      {(fermer) => (
        <form action={deleteOffer}>
          <input type="hidden" name="offerId" value={offerId} />
          <ModalBody>
            <p className="m-0 text-[13.6px] text-muted">
              « <b className="text-ink">{titre}</b> » ne sera plus proposée aux
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
