/**
 * Visuels de l'espace public.
 *
 * Chaque URL a été vérifiée en HTTP 200 avec un content-type image/*, deux fois
 * et indépendamment. Elles sont regroupées ici pour être remplaçables en un
 * seul endroit le jour où la chambre fournira ses propres photos.
 *
 * Next optimise et met ces images en cache côté serveur : le visiteur ne dépend
 * pas de la disponibilité de l'hébergeur à chaque chargement.
 *
 * Licences : Unsplash et Pexels autorisent l'usage commercial sans attribution
 * obligatoire, et le lien direct depuis leur CDN.
 */
export interface VisuelPublic {
  url: string;
  alt: string;
}

export const VISUELS: Record<"hero" | "toronto" | "madagascar", VisuelPublic> = {
  /**
   * Réception de fin de journée, lumière chaude, verres à pied.
   *
   * C'est le registre « 5 à 7 » de la chambre. Un premier candidat montrait une
   * pause-café en plein jour : correct sur le fond, mais il jurait avec les
   * autres visuels, tous en lumière basse, et lisait « séminaire » plutôt que
   * « réseau d'affaires international ».
   */
  hero: {
    url: "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1600&q=80&auto=format&fit=crop",
    alt: "Professionnels en conversation lors d’une soirée de réseautage",
  },

  /** Skyline de Toronto à l'heure bleue — moitié canadienne de la bannière. */
  toronto: {
    url: "https://images.unsplash.com/photo-1543962226-818f4301073f?w=1600&q=80&auto=format&fit=crop",
    alt: "",
  },

  /** Allée des baobabs à contre-jour — moitié malgache de la bannière. */
  madagascar: {
    url: "https://images.unsplash.com/photo-1597426061335-e50c8697630b?w=1600&q=80&auto=format&fit=crop",
    alt: "",
  },
};

/**
 * Visuels des cartes d'événement.
 *
 * Attribués dans l'ordre chronologique, ce qui fait correspondre le port à
 * conteneurs à l'étape de Canada Expo à Tamatave — ville portuaire.
 */
export const VISUELS_EVENEMENTS: VisuelPublic[] = [
  {
    url: "https://images.pexels.com/photos/8761647/pexels-photo-8761647.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Participants échangeant autour d’une table lors d’une pause réseautage",
  },
  {
    url: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=1600&q=80&auto=format&fit=crop",
    alt: "Orateur s’adressant à une salle lors d’une conférence professionnelle",
  },
  {
    url: "https://images.unsplash.com/photo-1590496793907-4d66e2994b4d?w=1600&q=80&auto=format&fit=crop",
    alt: "Terminal à conteneurs et grues portuaires au crépuscule",
  },
];

/** Visuel d'un événement, choisi de façon stable à partir de son rang. */
export function visuelEvenement(_id: string, index: number): VisuelPublic | null {
  if (!VISUELS_EVENEMENTS.length) return null;
  return VISUELS_EVENEMENTS[index % VISUELS_EVENEMENTS.length];
}
