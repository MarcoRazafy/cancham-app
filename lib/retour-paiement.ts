export const RELAIS_RETOUR = "/api/paiements/retour";

export const REPLI_RETOUR = "/membre/cotisations";

const PAGES_DE_RETOUR = [
  /^\/membre\/cotisations\/retour\?/,
  /^\/evenements\/[A-Za-z0-9_-]+\/billet\?/,
];

export function versRelais(chemin: string): string {
  return `${RELAIS_RETOUR}?${new URLSearchParams({ vers: chemin })}`;
}

export function destinationDuRetour(vers: string | null | undefined): string {
  const chemin = String(vers ?? "");
  if (!chemin.startsWith("/") || chemin.startsWith("//")) return REPLI_RETOUR;
  if (!/^[\x21-\x7e]+$/.test(chemin) || chemin.includes("\\")) {
    return REPLI_RETOUR;
  }
  return PAGES_DE_RETOUR.some((page) => page.test(chemin))
    ? chemin
    : REPLI_RETOUR;
}
