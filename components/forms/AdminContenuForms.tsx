"use client";

import { useState } from "react";
import { Check, FileUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  CancelButton,
  ChampPhoto,
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
  deleteResource,
  enregistrerActualite,
  enregistrerOffre,
  enregistrerRessource,
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
  return (
    <form
      action={enregistrerActualite}
      className="grid gap-4 lg:grid-cols-[1fr_340px] items-start"
    >
      {news ? <input type="hidden" name="newsId" value={news.id} /> : null}

      <Card className="p-6 flex flex-col gap-4 min-w-0">
        <ChampPhoto
          name="image"
          retirer="retirerImage"
          apercu={news?.image}
          aide="Sans photo, un bandeau aux couleurs de la chambre la remplace dans le fil."
        />
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
            <ChampPhoto
              name="image"
              retirer="retirerImage"
              apercu={offre?.image}
              aide="Sans photo, la carte reprend la couverture de l’entreprise."
            />
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

/* ============================ Ressources ============================ */

/** Même plafond que le serveur, pour prévenir avant d'envoyer 60 Mo pour rien. */
const PLAFOND_MO = 38;

export interface RessourceEditee {
  id: string;
  titre: string;
  cat: string;
  type: "gratuit" | "payant";
  prix: number;
  fmt: "pdf" | "docx" | "video";
  taille: string;
  pret: boolean;
  pages: number | null;
  cover: string | null;
}

/** Ajout ou modification d'une ressource, fichier compris. */
export function FormulaireRessource({
  ressource,
}: {
  ressource?: RessourceEditee;
}) {
  const [payant, setPayant] = useState(ressource?.type === "payant");
  const [fichier, setFichier] = useState<File | null>(null);
  const trop = fichier ? fichier.size > PLAFOND_MO * 1024 * 1024 : false;

  return (
    <form
      action={enregistrerRessource}
      className="grid gap-4 lg:grid-cols-[1fr_340px] items-start"
    >
      {ressource ? (
        <input type="hidden" name="resourceId" value={ressource.id} />
      ) : null}

      <Card className="p-6 flex flex-col gap-4 min-w-0">
        <ChampPhoto
          name="cover"
          retirer="retirerCover"
          apercu={ressource?.cover}
          libelle="Photo de la carte"
          aide="Illustre la ressource dans la bibliothèque. Sans photo, un motif décoratif la remplace."
        />
        <Field label="Titre">
          <input
            name="titre"
            required
            defaultValue={ressource?.titre}
            placeholder="Ex. Guide pratique — Exporter vers le Québec"
            className={INPUT}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Catégorie">
            <select
              name="cat"
              defaultValue={ressource?.cat ?? "Guide"}
              className={INPUT}
            >
              {["Guide", "Modèle", "Formation", "Rapport"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Accès">
            <select
              name="type"
              value={payant ? "payant" : "gratuit"}
              onChange={(e) => setPayant(e.target.value === "payant")}
              className={INPUT}
            >
              <option value="gratuit">Inclus dans l’adhésion</option>
              <option value="payant">Payant</option>
            </select>
          </Field>
        </div>
        {payant ? (
          <Field
            label="Prix (Ariary)"
            hint="Le paiement en ligne n’est pas branché : les membres envoient une demande d’achat, visible au tableau de bord."
          >
            <input
              type="number"
              name="prix"
              min={1}
              required
              defaultValue={ressource?.prix || 50000}
              className={INPUT}
            />
          </Field>
        ) : null}
      </Card>

      <div className="flex flex-col gap-4 lg:sticky lg:top-[88px]">
        <Card className="p-6 flex flex-col gap-3">
          <span className="text-[12.3px] font-semibold text-muted">
            Fichier
          </span>
          {ressource ? (
            <p
              className={`m-0 text-[13px] ${ressource.pret ? "text-success-strong" : "text-accent font-semibold"}`}
            >
              {ressource.pret
                ? `Fichier actuel : ${ressource.fmt === "video" ? "vidéo" : `${ressource.fmt.toUpperCase()}, ${ressource.pages} page${(ressource.pages ?? 0) > 1 ? "s" : ""}`} · ${ressource.taille}`
                : "Aucun fichier lisible : les membres ne peuvent pas l’ouvrir."}
            </p>
          ) : null}
          <label
            className={`flex flex-col items-center justify-center gap-2 text-center rounded-[var(--radius-m)] border-2 border-dashed px-4 py-7 cursor-pointer ${
              trop
                ? "border-accent bg-accent-soft"
                : "border-line bg-surface-2 hover:border-faint"
            }`}
          >
            <FileUp size={24} className="text-muted" />
            <span className="text-[13px] font-semibold text-ink">
              {fichier
                ? fichier.name
                : ressource
                  ? "Remplacer le fichier"
                  : "Choisir le fichier"}
            </span>
            <span
              className={`text-[11.8px] ${trop ? "text-accent font-semibold" : "text-faint"}`}
            >
              {trop
                ? `Trop lourd : ${PLAFOND_MO} Mo au plus.`
                : `PDF, DOCX ou vidéo MP4 · ${PLAFOND_MO} Mo au plus`}
            </span>
            <input
              type="file"
              name="fichier"
              accept="application/pdf,.docx,video/mp4"
              required={!ressource}
              className="sr-only"
              onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="m-0 text-[11.8px] text-faint">
            Les documents sont convertis en pages images pour la lecture
            protégée : comptez quelques secondes, un peu plus pour un DOCX.
          </p>
        </Card>

        <SubmitButton
          pendingLabel="Préparation du fichier…"
          className="w-full"
          disabled={trop}
        >
          <Check size={15} />{" "}
          {ressource ? "Enregistrer les modifications" : "Ajouter la ressource"}
        </SubmitButton>
      </div>
    </form>
  );
}

export function SupprimerRessourceButton({
  resourceId,
  titre,
}: {
  resourceId: string;
  titre: string;
}) {
  return (
    <Modal
      title="Retirer la ressource"
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
        <form action={deleteResource}>
          <input type="hidden" name="resourceId" value={resourceId} />
          <ModalBody>
            <p className="m-0 text-[13.6px] text-muted">
              « <b className="text-ink">{titre}</b> » sera retirée de la
              bibliothèque, fichier et commentaires compris.
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
