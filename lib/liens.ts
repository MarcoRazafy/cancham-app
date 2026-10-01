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

/** La page où un membre réserve un type de rendez-vous donné. */
export function cheminRendezvous(typeId: string): string {
  return `/membre/rendez-vous?type=${encodeURIComponent(typeId)}`;
}

/** Un lien vers une page de la plateforme, rangé en chemin. */
export function estLienInterne(lien: string): boolean {
  return lien.startsWith("/") && !lien.startsWith("//");
}

/**
 * Le lien d'un service, tel qu'on le range.
 *
 * L'équipe colle ce qu'elle a sous la main : le lien d'un rendez-vous copié
 * depuis la plateforme, un chemin, ou l'adresse d'un autre site. Une adresse
 * de la plateforme elle-même — une de ses `origines` — est rangée en chemin :
 * elle s'ouvre alors sur place, et survit à un changement de domaine. Tout
 * le reste doit être une adresse web en `http` ou `https`.
 *
 * `null` : la saisie n'est pas un lien. Une saisie vide n'en est pas un non
 * plus — à l'appelant de distinguer « pas de lien » de « lien refusé ».
 */
export function normaliserLien(
  saisie: string,
  origines: readonly string[] = [],
): string | null {
  const brut = saisie.trim();
  if (!brut || /[\s\\]/.test(brut)) return null;

  // « https://ici//ailleurs.example » donnerait le chemin « //ailleurs.example »,
  // que le navigateur lit comme une adresse : ce n'est pas un chemin d'ici.
  const enChemin = (url: URL) => {
    const chemin = `${url.pathname}${url.search}${url.hash}`;
    return estLienInterne(chemin) ? chemin : null;
  };

  // Un chemin saisi passe par la même garde, une fois résolu : « /.//ailleurs »
  // a l'air d'un chemin, et se résout en « //ailleurs ».
  if (brut.startsWith("/")) {
    if (!estLienInterne(brut)) return null;
    try {
      return enChemin(new URL(brut, "https://plateforme.invalid"));
    } catch {
      return null;
    }
  }

  const hotes = origines.flatMap((o) => {
    try {
      return [new URL(o).host];
    } catch {
      return [];
    }
  });
  // « equipe@cancham.mg » se lit comme une adresse web avec un identifiant, et
  // « https://ici@ailleurs.example » affiche un hôte pour mener à un autre :
  // un lien ne porte jamais d'identifiants.
  const sansIdentifiants = (url: URL) => !url.username && !url.password;

  // Une adresse de la plateforme d'abord : en local, son hôte — `localhost` —
  // n'a pas la forme d'un nom de domaine, et serait refusé plus bas.
  if (/^https?:\/\//i.test(brut)) {
    try {
      const url = new URL(brut);
      if (!sansIdentifiants(url)) return null;
      if (hotes.includes(url.host)) return enChemin(url);
    } catch {
      return null;
    }
  }

  const complet = normaliserSite(brut);
  if (!complet) return null;
  const url = new URL(complet);
  if (!sansIdentifiants(url)) return null;
  return hotes.includes(url.host) ? enChemin(url) : complet;
}

/**
 * Le type de rendez-vous qu'un lien désigne, ou `null` si ce n'est pas le
 * lien d'un rendez-vous. Sert à savoir si le rendez-vous est encore ouvert.
 */
export function typeDuLienRendezvous(lien: string): string | null {
  if (!lien.startsWith("/membre/rendez-vous?")) return null;
  return new URLSearchParams(lien.slice(lien.indexOf("?") + 1)).get("type");
}

/**
 * Un chemin que les membres ne peuvent pas ouvrir : l'espace de l'équipe, la
 * connexion, les points d'entrée techniques.
 */
export function estCheminFerme(lien: string): boolean {
  return /^\/(admin|auth|api|bac-a-sable)(\/|\?|#|$)/.test(lien);
}
