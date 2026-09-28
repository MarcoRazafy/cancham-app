import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  Library,
  Pencil,
  Plus,
} from "lucide-react";
import { SupprimerRessourceButton } from "@/components/forms/AdminContenuForms";
import {
  BoutonNouveauDossier,
  CarteDossier,
} from "@/components/forms/DossiersRessources";
import { ResourceCard } from "@/components/domain";
import { EmptyState, ViewHead } from "@/components/ui";
import { DownloadResourceButton } from "@/components/forms/ContentForms";
import {
  getArborescenceDossiers,
  getFilDossier,
  getResourceCounts,
  getResources,
  getSousDossiers,
} from "@/lib/queries";
import type { Space } from "@/lib/types";

type Filtre = "tout" | "gratuit" | "payant";

const TABS: { key: Filtre; label: string }[] = [
  { key: "tout", label: "Tout" },
  { key: "gratuit", label: "Gratuit" },
  { key: "payant", label: "Payant" },
];

/**
 * La bibliothèque, rangée en dossiers.
 *
 * On ouvre un dossier comme on ouvre un classeur : le fil d'Ariane dit où
 * l'on se trouve, les sous-dossiers viennent d'abord, les documents dessous.
 * Un dossier introuvable — lien devenu caduc — ramène à la racine plutôt
 * que d'afficher une erreur.
 *
 * Les membres parcourent le même rangement ; seule l'équipe le modifie.
 */
export async function RessourcesPage({
  space,
  type = "tout",
  dossier,
}: {
  space: Space;
  type?: string;
  dossier?: string;
}) {
  const admin = space === "admin";
  const actif: Filtre = type === "gratuit" || type === "payant" ? type : "tout";

  const fil = dossier ? await getFilDossier(dossier) : null;
  const dossierId = fil?.length ? fil[fil.length - 1].id : null;

  const [sousDossiers, list, counts, arborescence] = await Promise.all([
    getSousDossiers(dossierId),
    getResources(actif === "tout" ? undefined : actif, dossierId),
    getResourceCounts(dossierId),
    admin ? getArborescenceDossiers() : Promise.resolve([]),
  ]);

  const lien = (t: Filtre) =>
    `/${space}/ressources?type=${t}${dossierId ? `&dossier=${dossierId}` : ""}`;

  return (
    <>
      <ViewHead
        title="Ressources"
        action={
          admin ? (
            <div className="flex flex-wrap items-center gap-2">
              <BoutonNouveauDossier parentId={dossierId} />
              <Link
                href={`/admin/ressources/nouvelle${dossierId ? `?dossier=${dossierId}` : ""}`}
                className="btn-action btn-action-sm no-underline"
              >
                <Plus size={15} /> Nouvelle ressource
              </Link>
            </div>
          ) : null
        }
      >
        Documents, modèles et formations mis à disposition des membres. Certains
        livrables de fond sont facturés en supplément de la cotisation.
      </ViewHead>

      {/*
        Le fil d'Ariane ne s'affiche qu'une fois sorti de la racine : à la
        racine, il ne dirait rien que le titre ne dise déjà.
      */}
      {fil?.length ? (
        <nav
          aria-label="Chemin du dossier"
          className="mb-4 flex flex-wrap items-center gap-1 text-[13px]"
        >
          <Link
            href={`/${space}/ressources`}
            className="inline-flex items-center gap-1.5 font-semibold text-muted no-underline hover:text-accent"
          >
            <Library size={14} /> Bibliothèque
          </Link>
          {fil.map((m, i) => (
            <span key={m.id} className="inline-flex items-center gap-1">
              <ChevronRight size={13} className="text-faint" />
              {i === fil.length - 1 ? (
                <span className="font-semibold text-ink">{m.nom}</span>
              ) : (
                <Link
                  href={`/${space}/ressources?dossier=${m.id}`}
                  className="font-semibold text-muted no-underline hover:text-accent"
                >
                  {m.nom}
                </Link>
              )}
            </span>
          ))}
        </nav>
      ) : null}

      <div className="mb-[18px] flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={lien(t.key)}
            className={`mr-[18px] border-b-2 px-1 py-2.5 text-[13.5px] font-semibold no-underline ${
              actif === t.key
                ? "border-accent text-accent"
                : "border-transparent text-faint hover:text-ink"
            }`}
          >
            {t.label} ({counts[t.key]})
          </Link>
        ))}
      </div>

      {sousDossiers.length ? (
        <div className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sousDossiers.map((d) => (
            <CarteDossier
              key={d.id}
              dossier={d}
              space={space}
              admin={admin}
              arborescence={arborescence}
            />
          ))}
        </div>
      ) : null}

      {list.length ? (
        <div className="cascade grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              footer={
                admin ? (
                  <div className="flex w-full items-center gap-1.5">
                    {r.pret ? (
                      <DownloadResourceButton
                        resourceId={r.id}
                        space={space}
                        payant={r.type === "payant"}
                        video={r.fmt === "Vidéo"}
                      />
                    ) : (
                      <span className="flex-1 inline-flex items-center gap-1 text-[12px] font-semibold text-accent">
                        <AlertTriangle size={13} /> Fichier manquant
                      </span>
                    )}
                    <Link
                      href={`/admin/ressources/${r.id}/modifier`}
                      aria-label={`Modifier « ${r.titre} »`}
                      title="Modifier"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-s)] border border-line bg-surface text-muted hover:border-faint hover:text-ink"
                    >
                      <Pencil size={15} />
                    </Link>
                    <SupprimerRessourceButton
                      resourceId={r.id}
                      titre={r.titre}
                    />
                  </div>
                ) : (
                  <div className="flex w-full flex-col gap-1.5">
                    <DownloadResourceButton
                      resourceId={r.id}
                      space={space}
                      payant={r.type === "payant"}
                      video={r.fmt === "Vidéo"}
                    />
                  </div>
                )
              }
            />
          ))}
        </div>
      ) : sousDossiers.length ? null : (
        <EmptyState>
          {dossierId
            ? "Ce dossier est vide."
            : "Aucune ressource dans cette catégorie."}
        </EmptyState>
      )}
    </>
  );
}
