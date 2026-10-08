import Link from "next/link";
import { AlertTriangle, Pencil, Plus } from "lucide-react";
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
import {
  FilDossier,
  RechercheBibliotheque,
  type Filtre,
} from "@/components/pages/BibliothequeCommun";
import { VueDossier } from "@/components/pages/VueDossier";
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

/**
 * La bibliothèque, rangée en dossiers.
 *
 * À la racine, les dossiers viennent d'abord, les documents dessous. Un
 * dossier ouvert se présente autrement, comme un parcours (`VueDossier`).
 * Une recherche traverse toute la bibliothèque et rend ses résultats en
 * cartes, d'où qu'on l'ait lancée. Un dossier introuvable — lien devenu
 * caduc — ramène à la racine plutôt que d'afficher une erreur.
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

  // Un dossier ouvert, hors recherche : sa propre vue.
  if (fil?.length && !recherche) {
    return <VueDossier space={space} fil={fil} actif={actif} />;
  }

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
              <BoutonNouveauDossier parentId={dossierId} membres={membres} />
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

      {/* Une recherche lancée depuis un dossier garde le chemin du retour. */}
      {fil?.length ? (
        <div className="mb-4">
          <FilDossier space={space} fil={fil} />
        </div>
      ) : null}

      <RechercheBibliotheque
        space={space}
        dossierId={dossierId}
        recherche={recherche}
        actif={actif}
        comptes={counts}
      />

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
              membres={membres}
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
