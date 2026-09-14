import { redirect } from "next/navigation";

/**
 * Message de confirmation après une action.
 *
 * Il transite par l'URL plutôt que par un état client : l'action serveur
 * redirige, la page se recharge avec les données à jour, et le message
 * s'affiche. Pas de contexte React à maintenir, et ça marche sans JavaScript.
 */
export function redirectWithFlash(path: string, message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}msg=${encodeURIComponent(message)}`);
}
