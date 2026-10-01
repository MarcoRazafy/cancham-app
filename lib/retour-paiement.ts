/**
 * Le retour d'un payeur depuis la page du prestataire.
 *
 * Le prestataire ramène le payeur à une seule adresse de la plateforme, le
 * relais `/api/paiements/retour`, qui l'envoie ensuite à la page voulue. Une
 * seule adresse à déclarer chez lui, et elle répond quelle que soit la
 * manière dont il y renvoie — un lien, ou un formulaire qu'il poste.
 *
 * Sans `server-only` : rien ici ne touche au serveur, et les tests s'en
 * servent tels quels.
 */

/** Le relais, en chemin de la plateforme. */
export const RELAIS_RETOUR = "/api/paiements/retour";

/** Là où le relais dépose le payeur s'il ne sait pas où l'envoyer. */
export const REPLI_RETOUR = "/membre/cotisations";

/**
 * Les pages où un paiement peut ramener : la page de retour de l'espace
 * membre, et le billet d'une inscription publique.
 */
const PAGES_DE_RETOUR = [
  /^\/membre\/cotisations\/retour\?/,
  /^\/evenements\/[^/?#]+\/billet\?/,
];

/** L'adresse du relais qui mènera à `chemin`, une page de la plateforme. */
export function versRelais(chemin: string): string {
  return `${RELAIS_RETOUR}?${new URLSearchParams({ vers: chemin })}`;
}

/**
 * Où le relais envoie le payeur. Le paramètre vient de l'adresse, donc de
 * n'importe qui : seule une page de retour de la plateforme est acceptée —
 * jamais une adresse complète, jamais un autre chemin. Sinon, le repli.
 */
export function destinationDuRetour(vers: string | null | undefined): string {
  const chemin = String(vers ?? "");
  if (!chemin.startsWith("/") || chemin.startsWith("//")) return REPLI_RETOUR;
  if (/[\\\s]/.test(chemin)) return REPLI_RETOUR;
  return PAGES_DE_RETOUR.some((page) => page.test(chemin))
    ? chemin
    : REPLI_RETOUR;
}
