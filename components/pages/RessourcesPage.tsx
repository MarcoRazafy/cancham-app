import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  Library,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { SupprimerRessourceButton } from "@/components/forms/AdminContenuForms";
import {
  BarrePressePapier,
  BarreSelection,
  BoutonAcces,
  MenuRessource,
} from "@/components/forms/BibliothequeOutils";
import {
  BoutonNouveauDossier,
  CarteDossier,
} from "@/components/forms/DossiersRessources";
import { FiltreTarif } from "@/components/forms/FiltreTarif";
import { copierRessources } from "@/lib/actions/content";
import { lirePressePapier } from "@/lib/presse-papier";
import {
  getAccesDesRessources,
  getMembresPourAcces,
} from "@/lib/queries-admin";
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
  q = "",
}: {
  space: Space;
  type?: string;
  dossier?: string;
  q?: string;
}) {
  const admin = space === "admin";
  const actif: Filtre = type === "gratuit" || type === "payant" ? type : "tout";
  const recherche = q.trim();

  const fil = dossier ? await getFilDossier(dossier) : null;
  const dossierId = fil?.length ? fil[fil.length - 1].id : null;

  const [sousDossiers, list, counts, arborescence, membres, presse] =
    await Promise.all([
      // Une recherche traverse la bibliothèque : les dossiers s'effacent le
      // temps qu'elle dure.
      recherche ? Promise.resolve([]) : getSousDossiers(dossierId),
      getResources(actif === "tout" ? undefined : actif, dossierId, recherche),
      getResourceCounts(dossierId, recherche),
      admin ? getArborescenceDossiers() : Promise.resolve([]),
      admin ? getMembresPourAcces() : Promise.resolve([]),
      admin ? lirePressePapier() : Promise.resolve(null),
    ]);

  // Les accès de toutes les ressources payantes affichées, en une requête :
  // la fenêtre « qui y a accès » s'ouvre alors sans attendre.
  const acces = admin
    ? await getAccesDesRessources(
        list.filter((r) => r.type === "payant").map((r) => r.id),
      )
    : {};

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

      {/*
        Un formulaire GET : la recherche vit dans l'adresse, donc elle se
        partage, se met en favori et survit au rechargement.
      */}
      <form
        method="get"
        action={`/${space}/ressources`}
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        {dossierId ? (
          <input type="hidden" name="dossier" value={dossierId} />
        ) : null}
        <label className="relative min-w-[220px] flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            name="q"
            defaultValue={recherche}
            placeholder="Chercher un document dans toute la bibliothèque…"
            className="w-full rounded-[var(--radius-s)] border border-line bg-surface py-2 pl-9 pr-3 text-[13.4px] text-ink placeholder:text-faint"
          />
        </label>
        {/*
          Le filtre est une liste déroulante et non des onglets : il tient à
          côté de la recherche, où l'on cherche déjà, et il dit son compte.
          Il se soumet tout seul — un bouton « Filtrer » de plus n'apprendrait
          rien à personne.
        */}
        <FiltreTarif
          actif={actif}
          options={TABS.map((t) => ({
            key: t.key,
            label: t.label,
            compte: counts[t.key],
          }))}
        />
        {recherche || actif !== "tout" ? (
          <Link
            href={`/${space}/ressources${dossierId ? `?dossier=${dossierId}` : ""}`}
            className="text-[12.8px] font-semibold text-muted no-underline hover:text-accent"
          >
            Effacer
          </Link>
        ) : null}
      </form>

      {recherche ? (
        <p className="mb-4 text-[13px] text-muted">
          {list.length} résultat{list.length > 1 ? "s" : ""} pour «&nbsp;
          {recherche}&nbsp;» — toute la bibliothèque est fouillée, dossiers
          compris.
        </p>
      ) : null}

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

      {/*
        Un seul formulaire pour toute la liste : chaque case cochée part avec
        le bouton qu'on presse, et la sélection n'a besoin d'aucun état tenu
        côté navigateur. Le presse-papier, lui, vit dans un cookie — entre
        « couper » et « coller ici », on change de page.

        Le formulaire enveloppe aussi le cas de la liste vide : c'est
        précisément dans un dossier vide qu'on vient coller.
      */}
      <FormulaireListe admin={admin} dossierId={dossierId}>
        {admin && presse ? (
          <BarrePressePapier nombre={presse.ids.length} mode={presse.mode} />
        ) : null}
        {admin && list.length ? (
          <BarreSelection membres={membres} dossierId={dossierId} />
        ) : null}

        {list.length ? (
          <div className="cascade grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                coin={
                  admin ? (
                    <label
                      title="Sélectionner"
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-s)] bg-white/95 shadow-[var(--shadow)]"
                    >
                      <input
                        type="checkbox"
                        name="ressource"
                        value={r.id}
                        aria-label={`Sélectionner « ${r.titre} »`}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                    </label>
                  ) : undefined
                }
                footer={
                  admin ? (
                    <div className="flex w-full items-center gap-1.5">
                      {r.pret ? (
                        <DownloadResourceButton
                          resourceId={r.id}
                          space={space}
                          accessible={r.accessible ?? r.type === "gratuit"}
                          video={r.fmt === "Vidéo"}
                        />
                      ) : (
                        <span className="flex-1 inline-flex items-center gap-1 text-[12px] font-semibold text-accent">
                          <AlertTriangle size={13} /> Fichier manquant
                        </span>
                      )}
                      {/* L'œil ne vaut que pour une ressource facturée : une
                          ressource incluse n'a pas de liste d'accès. */}
                      {r.type === "payant" ? (
                        <BoutonAcces
                          resourceId={r.id}
                          titre={r.titre}
                          acces={acces[r.id] ?? []}
                          membres={membres}
                        />
                      ) : null}
                      <Link
                        href={`/admin/ressources/${r.id}/modifier`}
                        aria-label={`Modifier « ${r.titre} »`}
                        title="Modifier"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-s)] border border-line bg-surface text-muted hover:border-faint hover:text-ink"
                      >
                        <Pencil size={15} />
                      </Link>
                      <MenuRessource
                        id={r.id}
                        titre={r.titre}
                        dossierId={dossierId}
                      />
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
                        accessible={r.accessible ?? r.type === "gratuit"}
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
            {recherche
              ? "Aucun document ne porte ce titre."
              : dossierId
                ? "Ce dossier est vide."
                : "Aucune ressource dans cette catégorie."}
          </EmptyState>
        )}
      </FormulaireListe>
    </>
  );
}

/**
 * La liste, dans un formulaire côté équipe — et telle quelle côté membre.
 *
 * Un adhérent n'a rien à cocher : lui poser un formulaire autour de la
 * bibliothèque n'ajouterait qu'un élément vide dans la page.
 */
function FormulaireListe({
  admin,
  dossierId,
  children,
}: {
  admin: boolean;
  dossierId: string | null;
  children: React.ReactNode;
}) {
  if (!admin) return <>{children}</>;
  return (
    <form action={copierRessources}>
      <input type="hidden" name="dossier" value={dossierId ?? ""} />
      {children}
    </form>
  );
}
