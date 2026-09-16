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
 * Depuis la livraison des photos de la chambre, tout ce qui montre un événement
 * CanCham pointe sur `public/photos/`. Ne restent en banque d'images que les
 * deux moitiés symboliques de la bannière — Toronto et l'allée des baobabs —
 * qu'aucune photo de la chambre ne remplace. Unsplash autorise l'usage
 * commercial sans attribution et le lien direct depuis son CDN.
 */
export interface VisuelPublic {
  url: string;
  alt: string;
}

export const VISUELS: Record<"hero" | "toronto" | "madagascar", VisuelPublic> =
  {
    /**
     * Réception de fin de journée, lumière chaude, verres à pied.
     *
     * C'est le registre « 5 à 7 » de la chambre. Un premier candidat montrait une
     * pause-café en plein jour : correct sur le fond, mais il jurait avec les
     * autres visuels, tous en lumière basse, et lisait « séminaire » plutôt que
     * « réseau d'affaires international ».
     */
    hero: {
      url: "/photos/cancham-16.jpg",
      alt: "Salle comble lors d’une rencontre CanCham à Antananarivo",
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
    url: "/photos/cancham-07.jpg",
    alt: "Participants réunis lors d’une rencontre de la chambre",
  },
  {
    url: "/photos/cancham-22.jpg",
    alt: "Intervenant s’adressant à la salle lors d’une conférence CanCham",
  },
  {
    url: "/photos/cancham-03.jpg",
    alt: "Table d’accueil et émargement à l’entrée d’un événement",
  },
];

/** Visuel d'un événement, choisi de façon stable à partir de son rang. */
export function visuelEvenement(
  _id: string,
  index: number,
): VisuelPublic | null {
  if (!VISUELS_EVENEMENTS.length) return null;
  return VISUELS_EVENEMENTS[index % VISUELS_EVENEMENTS.length];
}
