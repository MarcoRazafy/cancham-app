/**
 * Adresses de sites web saisies par les membres.
 *
 * Un membre tape « biosudessences.mg », « www.biosudessences.mg » ou l'adresse
 * complète : on accepte les trois et on range toujours la forme complète. Et
 * seuls `http` et `https` passent — un lien `javascript:` posé sur une fiche
 * publique s'exécuterait chez chaque visiteur qui clique dessus.
 */

/** Adresse complète, ou `null` si la saisie est vide ou n'est pas une adresse web. */
export function normaliserSite(saisie: string): string | null {
  const brut = saisie.trim();
  if (!brut) return null;
  const avecProtocole = /^https?:\/\//i.test(brut) ? brut : `https://${brut}`;
  try {
    const url = new URL(avecProtocole);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    // Un nom de domaine a au moins un point : « monsite » seul n'en est pas un.
    if (!url.hostname.includes(".")) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

/** Forme lisible : « biosudessences.mg ». */
export function affichageSite(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}
