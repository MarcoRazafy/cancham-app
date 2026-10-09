import "server-only";

import { headers } from "next/headers";

const tentatives = new Map<string, number[]>();

const CLES_MAX = 5_000;

function nettoyer(maintenant: number, fenetre: number) {
  for (const [cle, horodatages] of tentatives) {
    const restants = horodatages.filter((t) => maintenant - t < fenetre);
    if (restants.length) tentatives.set(cle, restants);
    else tentatives.delete(cle);
  }
}

export function tentative(cle: string, max: number, fenetreMs: number): number {
  const maintenant = Date.now();
  if (tentatives.size > CLES_MAX) nettoyer(maintenant, fenetreMs);

  const horodatages = (tentatives.get(cle) ?? []).filter(
    (t) => maintenant - t < fenetreMs,
  );
  horodatages.push(maintenant);
  tentatives.set(cle, horodatages);

  if (horodatages.length <= max) return 0;
  const plusAncienne = horodatages[0];
  return Math.ceil((fenetreMs - (maintenant - plusAncienne)) / 1000);
}

export function oublier(cle: string): void {
  tentatives.delete(cle);
}

export async function origineAppelante(): Promise<string> {
  const entetes = await headers();
  const transmise = entetes.get("x-forwarded-for")?.split(",")[0];
  return (transmise ?? entetes.get("x-real-ip") ?? "locale").trim();
}

export function minutes(secondes: number): number {
  return Math.max(1, Math.ceil(secondes / 60));
}
