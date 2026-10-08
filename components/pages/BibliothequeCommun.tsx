import Link from "next/link";
import { ChevronRight, LayoutGrid, Library, List, Search } from "lucide-react";
import { FiltreTarif } from "@/components/forms/FiltreTarif";
import { SelectAuto } from "@/components/forms/SelectAuto";
import type { TriBibliotheque } from "@/lib/queries";
import type { MaillonDossier, Space } from "@/lib/types";

export type Filtre = "tout" | "gratuit" | "payant";

/** La bibliothèque en cartes, ou en lignes. */
export type Vue = "grille" | "liste";

const TARIFS: { key: Filtre; label: string }[] = [
  { key: "tout", label: "Tous les types" },
  { key: "gratuit", label: "Gratuit" },
  { key: "payant", label: "Payant" },
];

/** Le fil d'Ariane : de la bibliothèque au dossier ouvert. */
export function FilDossier({
  space,
  fil,
}: {
  space: Space;
  fil: MaillonDossier[];
}) {
  return (
    <nav
      aria-label="Chemin du dossier"
      className="flex flex-wrap items-center gap-1 text-[13px]"
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
  );
}

/**
 * La recherche et le filtre de tarif.
 *
 * Un formulaire GET : la recherche vit dans l'adresse, donc elle se partage,
 * se met en favori et survit au rechargement.
 */
export function RechercheBibliotheque({
  space,
  dossierId,
  recherche,
  actif,
  comptes,
  tri,
  vue,
  compacte = false,
}: {
  space: Space;
  dossierId: string | null;
  recherche: string;
  actif: Filtre;
  /**
   * Ce que chaque tarif compte, dit dans la liste. Absent à la racine : on
   * n'y compterait que les documents hors de tout dossier.
   */
  comptes?: Record<Filtre, number>;
  /**
   * Le tri et la vue, à la racine de la bibliothèque et dans ses résultats.
   * Absents dans un dossier ouvert : il a son ordre à lui, et sa mise en
   * page.
   */
  tri?: TriBibliotheque;
  vue?: Vue;
  /**
   * Resserrée, pour tenir dans l'en-tête d'une carte : sans marge, et la
   * recherche à largeur fixe plutôt que sur toute la ligne.
   */
  compacte?: boolean;
}) {
  // L'adresse de la page telle qu'elle est, à une clé près : pour passer
  // d'une vue à l'autre sans perdre la recherche ni les filtres.
  const adresse = (v: Vue) => {
    const p = new URLSearchParams();
    if (dossierId) p.set("dossier", dossierId);
    if (recherche) p.set("q", recherche);
    if (actif !== "tout") p.set("type", actif);
    if (tri && tri !== "date") p.set("tri", tri);
    if (v !== "grille") p.set("vue", v);
    const suite = p.toString();
    return `/${space}/ressources${suite ? `?${suite}` : ""}`;
  };
  const bouton = (active: boolean) =>
    `flex h-[38px] w-[42px] items-center justify-center no-underline ${
      active
        ? "bg-accent text-white"
        : "bg-surface text-muted hover:bg-surface-2 hover:text-ink"
    }`;

  return (
    <form
      method="get"
      action={`/${space}/ressources`}
      className={`flex flex-wrap items-center gap-2 ${compacte ? "" : "mb-4"}`}
    >
      {dossierId ? (
        <input type="hidden" name="dossier" value={dossierId} />
      ) : null}
      {/* La vue choisie survit à une recherche. */}
      {vue && vue !== "grille" ? (
        <input type="hidden" name="vue" value={vue} />
      ) : null}
      <label
        className={`relative ${compacte ? "min-w-[180px] flex-1 @[680px]:w-[240px] @[680px]:flex-none" : "min-w-[220px] flex-1"}`}
      >
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
        />
        <input
          type="search"
          name="q"
          defaultValue={recherche}
          placeholder="Rechercher un document, un dossier…"
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
        options={TARIFS.map((t) => ({
          key: t.key,
          label: t.label,
          compte: comptes?.[t.key],
        }))}
      />
      {tri ? (
        <SelectAuto
          name="tri"
          valeur={tri}
          libelle="Trier"
          options={[
            { key: "date", label: "Date de modification" },
            { key: "nom", label: "Nom" },
          ]}
        />
      ) : null}
      {recherche || actif !== "tout" ? (
        <Link
          href={`/${space}/ressources${dossierId ? `?dossier=${dossierId}` : ""}`}
          className="text-[12.8px] font-semibold text-muted no-underline hover:text-accent"
        >
          Effacer
        </Link>
      ) : null}
      {/* En cartes ou en lignes : deux liens, celui de la vue en cours en
          rouge. */}
      {vue ? (
        <div
          role="group"
          aria-label="Affichage"
          className="flex overflow-hidden rounded-[var(--radius-s)] border border-line"
        >
          <Link
            href={adresse("grille")}
            aria-label="Afficher en cartes"
            aria-current={vue === "grille" ? "true" : undefined}
            title="En cartes"
            className={bouton(vue === "grille")}
          >
            <LayoutGrid size={17} />
          </Link>
          <Link
            href={adresse("liste")}
            aria-label="Afficher en liste"
            aria-current={vue === "liste" ? "true" : undefined}
            title="En liste"
            className={`${bouton(vue === "liste")} border-l border-line`}
          >
            <List size={17} />
          </Link>
        </div>
      ) : null}
    </form>
  );
}
