/**
 * Couleur du filet de survol d'une carte.
 *
 * Elle est tirée de l'identifiant plutôt que de la position : une entreprise ou
 * un événement garde ainsi la même couleur d'un écran à l'autre, et l'ordre de
 * tri ne redistribue pas les teintes à chaque filtrage.
 */
const FILETS = ["filet-vert", "filet-rouge", "filet-bleu", "filet-degrade"];

export function filetDe(graine: string): string {
  let h = 0;
  for (let i = 0; i < graine.length; i++)
    h = (h * 31 + graine.charCodeAt(i)) >>> 0;
  return FILETS[h % FILETS.length];
}
