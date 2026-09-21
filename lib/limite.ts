import "server-only";

import { headers } from "next/headers";

/**
 * Limitation des tentatives, contre les essais de mots de passe en série.
 *
 * Le compteur vit en mémoire du serveur : il suffit pour une chambre de
 * quelques centaines de membres sur un serveur unique, et ne demande ni
 * table ni service en plus. Il repart à zéro au redémarrage, et ne se partage
 * pas entre plusieurs instances — le jour où la plateforme tournera sur
 * plusieurs machines, ce compteur devra passer en base ou dans un cache
 * partagé.
 *
 * Deux garde-fous plutôt qu'un : on protège un compte visé en particulier
 * (adresse + origine), et on borne aussi ce qu'une même origine peut tenter,
 * tous comptes confondus.
 */

const tentatives = new Map<string, number[]>();

/** Au-delà, la mémoire est purgée des clés dormantes. */
const CLES_MAX = 5_000;

function nettoyer(maintenant: number, fenetre: number) {
  for (const [cle, horodatages] of tentatives) {
    const restants = horodatages.filter((t) => maintenant - t < fenetre);
    if (restants.length) tentatives.set(cle, restants);
    else tentatives.delete(cle);
  }
}

/**
 * Enregistre une tentative et dit combien de secondes attendre, ou 0 si la
 * voie est libre.
 */
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

/** Efface le compteur d'une clé : après une réussite, le compte repart net. */
export function oublier(cle: string): void {
  tentatives.delete(cle);
}

/**
 * Origine de la requête, telle que la voit le serveur. Derrière un proxy,
 * c'est la première adresse de `x-forwarded-for` — celle du client.
 */
export async function origineAppelante(): Promise<string> {
  const entetes = await headers();
  const transmise = entetes.get("x-forwarded-for")?.split(",")[0];
  return (transmise ?? entetes.get("x-real-ip") ?? "locale").trim();
}

/** Attente restante, en minutes, pour un message lisible. */
export function minutes(secondes: number): number {
  return Math.max(1, Math.ceil(secondes / 60));
}
