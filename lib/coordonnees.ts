/**
 * Coordonnées de la chambre, affichées sur la page de contact.
 *
 * Source : pied de page du site officiel cancham.mg, relevé le 16 septembre
 * 2026. Ce qui n'y est pas publié n'est pas inventé ici — l'adresse s'arrête
 * à la ville, et il n'y a pas d'horaires.
 *
 * Un seul fichier à modifier le jour où la chambre complète ou change ses
 * coordonnées.
 */
export const COORDONNEES = {
  telephone: "+261 34 50 280 53",
  email: "info@cancham.mg",
  adresse: "Antananarivo, Madagascar",
  site: "https://cancham.mg/",

  /**
   * À CONFIRMER. Le site ne publie aucun numéro WhatsApp : on reprend le
   * numéro mobile publié, sans avoir vérifié qu'il est joignable sur WhatsApp.
   * Passer à `null` masque l'entrée.
   */
  whatsapp: "+261 34 50 280 53" as string | null,

  /** Non publiés sur le site. `null` masque l'entrée. */
  horaires: null as string | null,

  /**
   * Pages légales de la chambre, hébergées avec son site de formation.
   *
   * Vérifiées en HTTP 200 le 23 septembre 2026. L'adresse annoncée pour la
   * confidentialité, sur `cancham.systeme.io`, ne répond pas — ce domaine
   * n'existe pas ; la page vit sur `formation.cancham.mg`, au chemin donné.
   */
  legal: {
    mentions: "https://www.formation.cancham.mg/mentionslegales",
    confidentialite: "https://www.formation.cancham.mg/contidentialite",
  },

  reseaux: {
    linkedin:
      "https://www.linkedin.com/company/cancham-madagascar-chambre-de-commerce-et-de-coop%C3%A9ration-canada-madagascar/",
    facebook: "https://www.facebook.com/CanChamMG",
  },
} as const;

/** Filigrane des ressources consultées dans la plateforme : la marque de la chambre. */
export const FILIGRANE = `CanCham · ${new URL(COORDONNEES.site).host}`;

/** Numéro sans espaces ni signe, tel que l'attendent `tel:` et `wa.me`. */
export function chiffres(numero: string): string {
  return numero.replace(/\D/g, "");
}

/**
 * Motifs proposés par le formulaire de contact.
 *
 * Ici et non dans l'action : un module `"use server"` n'exporte que des
 * fonctions asynchrones.
 */
export const MOTIFS_CONTACT = [
  "Adhésion et cotisation",
  "Événements",
  "Ressources",
  "Mise en relation",
  "Problème technique",
  "Autre demande",
] as const;
