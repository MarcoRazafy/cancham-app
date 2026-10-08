import Image from "next/image";
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
  type Vue,
} from "@/components/pages/BibliothequeCommun";
import { FORMULAIRE, Lignes, VueDossier } from "@/components/pages/VueDossier";
import { copierRessources } from "@/lib/actions/content";
import { lirePressePapier } from "@/lib/presse-papier";
import {
  getAccesDesRessources,
  getMembresPourAcces,
} from "@/lib/queries-admin";
import { ResourceCard } from "@/components/domain";
import { Card, EmptyState } from "@/components/ui";
import { DownloadResourceButton } from "@/components/forms/ContentForms";
import {
  getArborescenceDossiers,
  getFilDossier,
  getResources,
  getSousDossiers,
  rechercherDossiers,
  type TriBibliotheque,
} from "@/lib/queries";
import type { Space } from "@/lib/types";

/**
 * La bibliothèque, rangée en dossiers.
 *
 * À la racine, les dossiers viennent d'abord, les documents dessous, en
 * cartes ou en liste, triés par date ou par nom. Un dossier ouvert se
 * présente autrement, comme un parcours (`VueDossier`). Une recherche
 * traverse toute la bibliothèque — dossiers et documents —, d'où qu'on
 * l'ait lancée. Un dossier introuvable — lien devenu caduc — ramène à la
 * racine plutôt que d'afficher une erreur.
 *
 * Les membres parcourent le même rangement ; seule l'équipe le modifie.
 */
export async function RessourcesPage({
  space,
  type = "tout",
  dossier,
  q = "",
  tri: triDemande,
  vue: vueDemandee,
}: {
  space: Space;
  type?: string;
  dossier?: string;
  q?: string;
  /** « date » (par défaut) ou « nom ». */
  tri?: string;
  /** « grille » (par défaut) ou « liste ». */
  vue?: string;
}) {
  const admin = space === "admin";
  const actif: Filtre = type === "gratuit" || type === "payant" ? type : "tout";
  const recherche = q.trim();
  const tri: TriBibliotheque = triDemande === "nom" ? "nom" : "date";
  const vue: Vue = vueDemandee === "liste" ? "liste" : "grille";

  const fil = dossier ? await getFilDossier(dossier) : null;
  const dossierId = fil?.length ? fil[fil.length - 1].id : null;

  // Un dossier ouvert, hors recherche : sa propre vue.
  if (fil?.length && !recherche) {
    return <VueDossier space={space} fil={fil} actif={actif} />;
  }

  const [sousDossiers, list, arborescence, membres, presse] = await Promise.all(
    [
      // Une recherche traverse la bibliothèque : elle rend les dossiers
      // dont le nom répond, où qu'ils soient rangés.
      recherche
        ? rechercherDossiers(recherche, tri)
        : getSousDossiers(dossierId, tri),
      getResources(
        actif === "tout" ? undefined : actif,
        dossierId,
        recherche,
        tri,
      ),
      admin ? getArborescenceDossiers() : Promise.resolve([]),
      admin ? getMembresPourAcces() : Promise.resolve([]),
      admin ? lirePressePapier() : Promise.resolve(null),
    ],
  );

  // Les accès de toutes les ressources payantes affichées, en une requête :
  // la fenêtre « qui y a accès » s'ouvre alors sans attendre.
  const acces = admin
    ? await getAccesDesRessources(
        list.filter((r) => r.type === "payant").map((r) => r.id),
      )
    : {};

  return (
    <>
      {/* ---------- En-tête : le titre, l'illustration, les commandes ---------- */}
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1 basis-[300px]">
          <h1 className="m-0 text-[28px] font-semibold">Ressources</h1>
        </div>
        {/* L'illustration de la bibliothèque, sur sa tache rose. Purement
            décorative : elle s'efface quand la place manque. */}
        <div
          aria-hidden
          className="relative hidden h-[120px] w-[254px] shrink-0 lg:block"
        >
          <span className="absolute inset-x-5 bottom-1 top-2 rounded-[46%_54%_52%_48%/58%_52%_48%_42%] bg-accent-soft" />
          <Image
            src="/marque/illustration-ressources.png"
            alt=""
            width={1100}
            height={550}
            priority
            sizes="254px"
            className="relative h-full w-full object-contain"
          />
        </div>
        {admin ? (
          <div className="flex flex-wrap items-center gap-2">
            <BoutonNouveauDossier parentId={dossierId} membres={membres} />
            <Link
              href={`/admin/ressources/nouvelle${dossierId ? `?dossier=${dossierId}` : ""}`}
              className="btn-action btn-action-sm no-underline"
            >
              <Plus size={15} /> Ajouter une ressource
            </Link>
          </div>
        ) : null}
      </div>

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
        tri={tri}
        vue={vue}
      />

      {recherche ? (
        <p className="mb-4 text-[13px] text-muted">
          {sousDossiers.length + list.length} résultat
          {sousDossiers.length + list.length > 1 ? "s" : ""} pour «&nbsp;
          {recherche}&nbsp;» — toute la bibliothèque est fouillée, dossiers
          compris.
        </p>
      ) : null}

      {sousDossiers.length ? (
        <section className="mb-7">
          <TitreRubrique titre="Dossiers" nombre={sousDossiers.length} />
          {/* Quatre cartes de front là où la page est large ; en liste, une
              par ligne. Le seuil est en rem, comme ceux de Tailwind, pour
              se ranger parmi eux. */}
          <div
            className={
              vue === "liste"
                ? "grid gap-2.5"
                : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 min-[85rem]:grid-cols-4"
            }
          >
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
        </section>
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
        {list.length ? (
          <TitreRubrique titre="Documents" nombre={list.length} />
        ) : null}
        {admin && list.length ? (
          <BarreSelection membres={membres} dossierId={dossierId} />
        ) : null}

        {list.length && vue === "liste" ? (
          // En liste : les mêmes lignes que dans un dossier ouvert.
          <Card className="overflow-hidden p-0 [&>ul>li:first-child]:border-t-0">
            <Lignes
              ressources={list}
              ctx={{
                space,
                admin,
                dossierId,
                acces,
                membres,
                arborescence,
                rangeable: false,
                ordonne: false,
              }}
            />
          </Card>
        ) : list.length ? (
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
                        // Ici, un tri range la liste : pas de rang à donner.
                        rangement={false}
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
              ? "Aucun document ni dossier ne porte ce nom."
              : dossierId
                ? "Ce dossier est vide."
                : "Aucune ressource dans cette catégorie."}
          </EmptyState>
        )}
      </FormulaireListe>
    </>
  );
}

/** Le titre d'une rubrique de la bibliothèque, et ce qu'elle compte. */
function TitreRubrique({ titre, nombre }: { titre: string; nombre: number }) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <h2 className="m-0 text-[19px] font-semibold">{titre}</h2>
      <span className="rounded-full bg-surface-3 px-2.5 py-0.5 text-[12.4px] font-semibold text-muted">
        {nombre}
      </span>
    </div>
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
    // Son identifiant : en liste, les cases à cocher des lignes s'y
    // rattachent par lui, comme dans un dossier ouvert.
    <form id={FORMULAIRE} action={copierRessources}>
      <input type="hidden" name="dossier" value={dossierId ?? ""} />
      {children}
    </form>
  );
}
