export type TypeAchat = "ressource" | "service";

export interface Achat {
  type: TypeAchat;
  id: string;
  titre: string;
  par: string | null;
}

export function estTypeAchat(v: string): v is TypeAchat {
  return v === "ressource" || v === "service";
}

export function detailAchat(
  a: { type: TypeAchat; id: string; titre: string },
  userId: string,
) {
  return { achat: a.type, cible: a.id, titre: a.titre, par: userId };
}

export function achatDe(detail: unknown): Achat | null {
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) {
    return null;
  }
  const d = detail as Record<string, unknown>;
  if (
    typeof d.achat !== "string" ||
    !estTypeAchat(d.achat) ||
    typeof d.cible !== "string" ||
    !d.cible
  ) {
    return null;
  }
  return {
    type: d.achat,
    id: d.cible,
    titre: typeof d.titre === "string" ? d.titre : "",
    par: typeof d.par === "string" ? d.par : null,
  };
}

export function objetAchat(a: { type: TypeAchat; titre: string }): string {
  return `${a.type === "ressource" ? "Ressource" : "Service"} — ${a.titre}`;
}

export function pageAchat(a: { type: TypeAchat; id: string }): string {
  return a.type === "ressource"
    ? `/membre/ressources/${a.id}`
    : "/membre/offres-cancham";
}
