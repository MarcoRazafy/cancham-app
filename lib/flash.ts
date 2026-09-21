import { redirect } from "next/navigation";

/**
 * Message de retour après une action.
 *
 * Il transite par l'URL plutôt que par un état client : l'action serveur
 * redirige, la page se recharge avec les données à jour, et le message
 * s'affiche. Pas de contexte React à maintenir, et ça marche sans JavaScript.
 *
 * Deux tons : la confirmation (`redirectWithFlash`) et l'erreur
 * (`redirectWithErreur`). Le toast ne les anime pas pareil — une coche qui
 * se trace pour l'une, une secousse pour l'autre —, et une erreur reste
 * affichée plus longtemps : elle demande qu'on la lise.
 */
function rediriger(path: string, message: string, erreur: boolean): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(
    `${path}${sep}msg=${encodeURIComponent(message)}${erreur ? "&ton=erreur" : ""}`,
  );
}

export function redirectWithFlash(path: string, message: string): never {
  rediriger(path, message, false);
}

export function redirectWithErreur(path: string, message: string): never {
  rediriger(path, message, true);
}
