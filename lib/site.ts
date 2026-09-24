/**
 * L'adresse publique du site, sans barre finale.
 *
 * Elle sert aux liens absolus : plan du site, balises canoniques, partages.
 * En production, `APP_URL` la porte ; sans elle — en développement —, on se
 * rabat sur le poste local, ce qui suffit pour vérifier la forme des liens.
 */
export function baseSite(): string {
  const brut = process.env.APP_URL?.trim().replace(/\/+$/, "");
  return brut || "http://localhost:3000";
}
