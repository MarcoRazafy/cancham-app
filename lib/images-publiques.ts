export interface VisuelPublic {
  url: string;
  alt: string;
}

export const VISUELS: Record<"hero" | "toronto" | "madagascar", VisuelPublic> =
  {
    hero: {
      url: "/photos/auth-rencontre.jpg",
      alt: "Intervenants et partenaires réunis lors d’une rencontre CanCham",
    },

    toronto: {
      url: "https://images.unsplash.com/photo-1543962226-818f4301073f?w=1600&q=80&auto=format&fit=crop",
      alt: "",
    },

    madagascar: {
      url: "https://images.unsplash.com/photo-1597426061335-e50c8697630b?w=1600&q=80&auto=format&fit=crop",
      alt: "",
    },
  };

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

export function visuelEvenement(
  _id: string,
  index: number,
): VisuelPublic | null {
  if (!VISUELS_EVENEMENTS.length) return null;
  return VISUELS_EVENEMENTS[index % VISUELS_EVENEMENTS.length];
}
