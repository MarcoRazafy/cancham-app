"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ClipboardPaste,
  Copy,
  Eye,
  MoreVertical,
  Scissors,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  CancelButton,
  INPUT,
  ModalBody,
  ModalFooter,
  SubmitButton,
} from "@/components/form-bits";
import {
  annulerPressePapier,
  collerRessources,
  couperRessources,
  mettreUneAuPressePapier,
  ouvrirAccesRessources,
} from "@/lib/actions/content";

/** Une entreprise, telle que la liste de choix l'affiche. */
export type MembreChoisissable = { id: string; nom: string; statut: string };

/**
 * Le menu d'une ressource : couper, copier, et le reste.
 *
 * Il appelle l'action directement, sans formulaire : la carte vit à
 * l'intérieur du formulaire de sélection, et un formulaire ne s'imbrique pas
 * dans un autre.
 */
export function MenuRessource({
  id,
  titre,
  payant,
  dossierId,
}: {
  id: string;
  titre: string;
  payant: boolean;
  dossierId: string | null;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [enCours, demarrer] = useTransition();

  const agir = (mode: "copier" | "couper") => {
    setOuvert(false);
    demarrer(() => {
      void mettreUneAuPressePapier(id, mode, dossierId);
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        disabled={enCours}
        aria-label={`Actions sur « ${titre} »`}
        aria-expanded={ouvert}
        title="Autres actions"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-s)] border border-line bg-surface text-muted hover:border-faint hover:text-ink"
      >
        <MoreVertical size={15} />
      </button>

      {ouvert ? (
        <>
          {/* Un clic n'importe où ailleurs referme le menu. */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOuvert(false)}
            className="fixed inset-0 z-20 cursor-default border-0 bg-transparent p-0"
          />
          <div className="absolute right-0 z-30 mt-1 w-[210px] overflow-hidden rounded-[var(--radius-m)] border border-line bg-surface py-1 shadow-[var(--shadow)]">
            <Entree onClick={() => agir("copier")} icone={<Copy size={14} />}>
              Copier
            </Entree>
            <Entree
              onClick={() => agir("couper")}
              icone={<Scissors size={14} />}
            >
              Couper
            </Entree>
            {payant ? (
              <Lien
                href={`/admin/ressources/${id}/acces`}
                icone={<Eye size={14} />}
              >
                Qui y a accès
              </Lien>
            ) : null}
            <Lien
              href={`/admin/ressources/${id}/modifier`}
              icone={<MoreVertical size={14} />}
            >
              Modifier
            </Lien>
          </div>
        </>
      ) : null}
    </div>
  );
}

const LIGNE_MENU =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13.2px] text-ink no-underline hover:bg-surface-2";

function Entree({
  onClick,
  icone,
  children,
}: {
  onClick: () => void;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${LIGNE_MENU} cursor-pointer border-0 bg-transparent`}
    >
      <span className="text-faint">{icone}</span>
      {children}
    </button>
  );
}

function Lien({
  href,
  icone,
  children,
}: {
  href: string;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={LIGNE_MENU}>
      <span className="text-faint">{icone}</span>
      {children}
    </Link>
  );
}

/**
 * La barre du presse-papier : elle n'apparaît que quand il porte quelque
 * chose, et colle dans le dossier ouvert.
 *
 * Les boutons vivent dans le formulaire de la liste — d'où `formAction`
 * plutôt qu'un formulaire à eux.
 */
export function BarrePressePapier({
  nombre,
  mode,
}: {
  nombre: number;
  mode: "copier" | "couper";
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[var(--radius-m)] border border-dashed border-accent/50 bg-accent-soft px-4 py-3">
      <span className="text-[13.2px] text-ink">
        <b>
          {nombre} ressource{nombre > 1 ? "s" : ""}
        </b>{" "}
        {mode === "couper" ? "à déplacer" : "à copier"}.
      </span>
      <div className="ml-auto flex items-center gap-2">
        <SubmitButton sm formAction={collerRessources} pendingLabel="Collage…">
          <ClipboardPaste size={14} /> Coller ici
        </SubmitButton>
        <SubmitButton
          sm
          variant="ghost"
          formAction={annulerPressePapier}
          pendingLabel="…"
        >
          <X size={14} /> Annuler
        </SubmitButton>
      </div>
    </div>
  );
}

/**
 * Ce qu'on fait des ressources cochées.
 *
 * Les boutons vivent dans le formulaire de la liste : chaque case cochée
 * part avec, sans qu'aucun état n'ait à être tenu côté navigateur.
 */
export function BarreSelection({
  membres,
  dossierId,
}: {
  membres: MembreChoisissable[];
  dossierId: string | null;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[var(--radius-m)] border border-line bg-surface-2 px-4 py-2.5">
      <span className="mr-1 text-[12.6px] text-muted">
        Cochez des ressources, puis :
      </span>
      <SubmitButton sm variant="line" pendingLabel="…">
        <Copy size={14} /> Copier
      </SubmitButton>
      <SubmitButton
        sm
        variant="line"
        formAction={couperRessources}
        pendingLabel="…"
      >
        <Scissors size={14} /> Couper
      </SubmitButton>
      <BoutonOuvrirAcces membres={membres} dossierId={dossierId} />
    </div>
  );
}

/**
 * Ouvrir un accès à plusieurs entreprises, pour toutes les ressources
 * cochées.
 *
 * L'équipe accorde rarement un seul accès : une formation s'ouvre à la
 * douzaine d'entreprises qui l'ont suivie, d'un coup. La recherche filtre la
 * liste sans recharger la page — on tape trois lettres, on coche.
 */
export function BoutonOuvrirAcces({
  membres,
  dossierId,
}: {
  membres: MembreChoisissable[];
  dossierId: string | null;
}) {
  return (
    <Modal
      title="Ouvrir l’accès à des entreprises"
      largeur="max-w-[620px]"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-s)] border border-line bg-surface px-3 py-1.5 text-[12.6px] font-semibold text-ink hover:border-faint"
        >
          <UserPlus size={14} /> Ouvrir un accès
        </button>
      )}
    >
      {(fermer) => (
        <ChoixMembres membres={membres} dossierId={dossierId} fermer={fermer} />
      )}
    </Modal>
  );
}

function ChoixMembres({
  membres,
  dossierId,
  fermer,
  resourceId,
}: {
  membres: MembreChoisissable[];
  dossierId: string | null;
  fermer: () => void;
  /** Sur la page d'une ressource : c'est elle qu'on ouvre, sans cocher. */
  resourceId?: string;
}) {
  const [q, setQ] = useState("");
  const filtre = q.trim().toLowerCase();
  const liste = filtre
    ? membres.filter((m) => m.nom.toLowerCase().includes(filtre))
    : membres;

  return (
    <>
      <ModalBody>
        {resourceId ? (
          <>
            <input type="hidden" name="ressource" value={resourceId} />
            {/* Depuis la fiche d'une ressource, on revient à la fiche. */}
            <input
              type="hidden"
              name="retour"
              value={`/admin/ressources/${resourceId}/acces`}
            />
          </>
        ) : null}
        <input type="hidden" name="dossier" value={dossierId ?? ""} />

        <p className="m-0 text-[13px] text-muted">
          Seules les ressources payantes ont une liste d’accès : les ressources
          incluses dans l’adhésion sont déjà ouvertes à tout membre à jour.
        </p>

        <label className="relative block">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Chercher une entreprise…"
            className={`${INPUT} pl-9`}
          />
        </label>

        <div className="max-h-[320px] overflow-y-auto rounded-[var(--radius-m)] border border-line">
          {liste.length ? (
            liste.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-3 border-b border-line px-3.5 py-2.5 text-[13.4px] last:border-b-0 hover:bg-surface-2"
              >
                <input
                  type="checkbox"
                  name="membre"
                  value={m.id}
                  className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                />
                <span className="min-w-0 flex-1 truncate">{m.nom}</span>
                {m.statut !== "a_jour" ? (
                  <span className="shrink-0 text-[11.5px] text-faint">
                    cotisation en retard
                  </span>
                ) : null}
              </label>
            ))
          ) : (
            <p className="m-0 px-4 py-6 text-center text-[13px] text-muted">
              Aucune entreprise ne correspond.
            </p>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <CancelButton onClick={fermer} />
        <SubmitButton
          formAction={resourceId ? undefined : ouvrirAccesRessources}
          pendingLabel="Ouverture…"
        >
          <UserPlus size={15} /> Ouvrir l’accès
        </SubmitButton>
      </ModalFooter>
    </>
  );
}

/** La même liste, sur la page d'une ressource : un formulaire à elle. */
export function BoutonAccesRessource({
  membres,
  resourceId,
}: {
  membres: MembreChoisissable[];
  resourceId: string;
}) {
  return (
    <Modal
      title="Ouvrir l’accès à des entreprises"
      largeur="max-w-[620px]"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          className="btn-action btn-action-sm"
        >
          <UserPlus size={15} /> Ouvrir un accès
        </button>
      )}
    >
      {(fermer) => (
        <form action={ouvrirAccesRessources}>
          <ChoixMembres
            membres={membres}
            dossierId={null}
            fermer={fermer}
            resourceId={resourceId}
          />
        </form>
      )}
    </Modal>
  );
}
