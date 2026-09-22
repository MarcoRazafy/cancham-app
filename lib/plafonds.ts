/**
 * Plafond de sécurité des envois de fichiers : photos, vidéos, documents.
 *
 * Pas de petite limite par type : un seul plafond, qui protège la mémoire du
 * serveur — un envoi y passe en entier avant d'être enregistré, et une
 * vidéo sans borne pourrait faire tomber la plateforme pour tout le monde.
 * Les photos restent redimensionnées et recompressées à l'envoi.
 *
 * Le même chiffre est déclaré à Next dans `next.config.ts`, pour les actions
 * (`bodySizeLimit`) et pour le proxy (`proxyClientMaxBodySize`) : sans ce
 * dernier, tout envoi passant par `/membre` ou `/admin` était tronqué au-delà
 * de 10 Mo, sans erreur.
 *
 * Sans dépendance : les formulaires s'en servent aussi, pour prévenir avant
 * l'envoi plutôt qu'après.
 */

/** Un envoi entier — tous les fichiers d'un formulaire —, en mégaoctets. */
export const PLAFOND_ENVOI_MO = 500;

/** Un fichier seul : le plafond, moins la place des autres champs. */
export const PLAFOND_FICHIER_MO = 490;

export const PLAFOND_ENVOI = PLAFOND_ENVOI_MO * 1024 * 1024;
export const PLAFOND_FICHIER = PLAFOND_FICHIER_MO * 1024 * 1024;
