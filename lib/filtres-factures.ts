import type { Devise } from "@/lib/membership";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { plat } from "@/lib/texte";

/**
 * Filtres de la liste des factures, lus depuis l'adresse. Partagés par la
 * page et par l'export.
 */
export interface FiltresFactures {
  statut: InvoiceStatus | "toutes";
  devise: Devise | null;
  annee: number | null;
  recherche: string;
}

export function lireFiltresFactures(params: {
  statut?: string;
  devise?: string;
  annee?: string;
  q?: string;
}): FiltresFactures {
  const annee = Number(params.annee);
  return {
    statut:
      params.statut === "payee" || params.statut === "envoyee"
        ? params.statut
        : "toutes",
    devise:
      params.devise === "MGA" || params.devise === "CAD" ? params.devise : null,
    annee: Number.isInteger(annee) && annee > 2000 ? annee : null,
    recherche: params.q?.trim() ?? "",
  };
}

/** Factures retenues par tout sauf le statut, pour compter les onglets. */
export function filtrerFacturesHorsStatut(
  factures: Invoice[],
  f: FiltresFactures,
): Invoice[] {
  return factures.filter(
    (x) =>
      (!f.devise || x.devise === f.devise) &&
      (!f.annee || x.date.startsWith(String(f.annee))) &&
      (!f.recherche ||
        plat(`${x.numero} ${x.membre} ${x.objet}`).includes(plat(f.recherche))),
  );
}

export function filtrerFactures(
  factures: Invoice[],
  f: FiltresFactures,
): Invoice[] {
  return filtrerFacturesHorsStatut(factures, f).filter(
    (x) => f.statut === "toutes" || x.statut === f.statut,
  );
}

export function parametresFactures(
  f: FiltresFactures,
  changes: Partial<
    Record<"statut" | "devise" | "annee" | "q", string | null>
  > = {},
): string {
  const p = new URLSearchParams();
  const tout = {
    statut: f.statut === "toutes" ? null : f.statut,
    devise: f.devise,
    annee: f.annee ? String(f.annee) : null,
    q: f.recherche || null,
    ...changes,
  };
  for (const [k, v] of Object.entries(tout))
    if (v && v !== "toutes") p.set(k, v);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}
