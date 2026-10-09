import path from "node:path";

export const RACINE_STOCKAGE = path.resolve(
  /*turbopackIgnore: true*/
  process.env.STOCKAGE_RACINE || path.join(process.cwd(), "stockage"),
);

export function dossierStockage(...parties: string[]): string {
  return path.join(/*turbopackIgnore: true*/ RACINE_STOCKAGE, ...parties);
}
