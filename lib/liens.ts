export function normaliserSite(saisie: string): string | null {
  const brut = saisie.trim();
  if (!brut) return null;
  const avecProtocole = /^https?:\/\//i.test(brut) ? brut : `https://${brut}`;
  try {
    const url = new URL(avecProtocole);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function affichageSite(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}

export function cheminRendezvous(typeId: string): string {
  return `/membre/rendez-vous?type=${encodeURIComponent(typeId)}`;
}

export function estLienInterne(lien: string): boolean {
  return lien.startsWith("/") && !lien.startsWith("//");
}

export function normaliserLien(
  saisie: string,
  origines: readonly string[] = [],
): string | null {
  const brut = saisie.trim();
  if (!brut || /[\s\\]/.test(brut)) return null;

  const enChemin = (url: URL) => {
    const chemin = `${url.pathname}${url.search}${url.hash}`;
    return estLienInterne(chemin) ? chemin : null;
  };

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
  const sansIdentifiants = (url: URL) => !url.username && !url.password;

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

export function typeDuLienRendezvous(lien: string): string | null {
  if (!lien.startsWith("/membre/rendez-vous?")) return null;
  return new URLSearchParams(lien.slice(lien.indexOf("?") + 1)).get("type");
}

export function estCheminFerme(lien: string): boolean {
  return /^\/(admin|auth|api|bac-a-sable)(\/|\?|#|$)/.test(lien);
}
