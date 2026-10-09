import Link from "next/link";
import { ChevronRight, LayoutGrid, Library, List, Search } from "lucide-react";
import { FiltreTarif } from "@/components/forms/FiltreTarif";
import { SelectAuto } from "@/components/forms/SelectAuto";
import type { TriBibliotheque } from "@/lib/queries";
import type { MaillonDossier, Space } from "@/lib/types";

export type Filtre = "tout" | "gratuit" | "payant";

export type Vue = "grille" | "liste";

const TARIFS: { key: Filtre; label: string }[] = [
  { key: "tout", label: "Tous les types" },
  { key: "gratuit", label: "Gratuit" },
  { key: "payant", label: "Payant" },
];

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
  comptes?: Record<Filtre, number>;
  tri?: TriBibliotheque;
  vue?: Vue;
  compacte?: boolean;
}) {
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
