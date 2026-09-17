import { ORDRE_FORMULES, type FormuleId } from "@/lib/membership";
import type { Member, MemberStatus } from "@/lib/types";
import { plat } from "@/lib/texte";

/**
 * Filtres de la liste des membres, lus depuis l'adresse.
 *
 * Partagés par la page et par l'export : le fichier téléchargé reprend
 * exactement la liste affichée à l'écran.
 */

export const STATUTS_FILTRE: { cle: MemberStatus | "tous"; libelle: string }[] =
  [
    { cle: "tous", libelle: "Tous" },
    { cle: "a_jour", libelle: "À jour" },
    { cle: "en_retard", libelle: "En retard" },
    { cle: "en_attente", libelle: "Paiement attendu" },
    { cle: "candidature", libelle: "Demandes" },
  ];

export interface FiltresMembres {
  statut: MemberStatus | "tous";
  recherche: string;
  formule: FormuleId | null;
}

export function lireFiltres(params: {
  statut?: string;
  tab?: string;
  q?: string;
  formule?: string;
}): FiltresMembres {
  // `tab` : ancien nom du paramètre, gardé pour les liens déjà partagés.
  const demande = params.statut ?? params.tab ?? "tous";
  return {
    statut: (STATUTS_FILTRE.some((s) => s.cle === demande)
      ? demande
      : "tous") as FiltresMembres["statut"],
    recherche: params.q?.trim() ?? "",
    formule: (ORDRE_FORMULES as string[]).includes(params.formule ?? "")
      ? (params.formule as FormuleId)
      : null,
  };
}

/** Membres retenus par la recherche et la formule, tous statuts confondus. */
export function filtrerHorsStatut(membres: Member[], f: FiltresMembres) {
  return membres.filter(
    (m) =>
      (!f.formule || m.formule === f.formule) &&
      (!f.recherche ||
        plat(`${m.nom} ${m.secteur} ${m.ville} ${m.pays ?? ""}`).includes(
          plat(f.recherche),
        )),
  );
}

export function filtrerMembres(membres: Member[], f: FiltresMembres) {
  return filtrerHorsStatut(membres, f).filter(
    (m) => f.statut === "tous" || m.statut === f.statut,
  );
}

/** Paramètres d'adresse d'une vue filtrée, sans les valeurs par défaut. */
export function parametresFiltres(
  f: FiltresMembres,
  changes: Partial<Record<"statut" | "q" | "formule", string | null>> = {},
): string {
  const p = new URLSearchParams();
  const tout = {
    statut: f.statut === "tous" ? null : f.statut,
    q: f.recherche || null,
    formule: f.formule,
    ...changes,
  };
  for (const [k, v] of Object.entries(tout)) if (v && v !== "tous") p.set(k, v);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}
