import Link from "next/link";
import { ChevronRight, Library, Search } from "lucide-react";
import { FiltreTarif } from "@/components/forms/FiltreTarif";
import type { MaillonDossier, Space } from "@/lib/types";

export type Filtre = "tout" | "gratuit" | "payant";

const TARIFS: { key: Filtre; label: string }[] = [
  { key: "tout", label: "Tout" },
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
}: {
  space: Space;
  dossierId: string | null;
  recherche: string;
  actif: Filtre;
  comptes: Record<Filtre, number>;
}) {
  return (
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
        options={TARIFS.map((t) => ({
          key: t.key,
          label: t.label,
          compte: comptes[t.key],
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
  );
}
