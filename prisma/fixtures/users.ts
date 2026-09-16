import type { Space, User } from "../../lib/types";

/**
 * Un utilisateur de démonstration par espace.
 *
 * Il n'y a volontairement AUCUNE authentification à ce stade : l'espace est
 * déterminé par l'URL (`/public`, `/membre`, `/admin`) et l'utilisateur courant
 * est simplement celui qui correspond à cet espace.
 *
 * Quand l'authentification arrivera, seule `getCurrentUser()` changera : elle
 * lira la session au lieu de piocher dans cette table. Rien d'autre dans
 * l'application ne dépend de la façon dont l'utilisateur est résolu.
 */
export const USERS: Record<Space, User> = {
  /**
   * Espace public — la personne n'est pas connectée. On la modélise quand même
   * comme un utilisateur pour donner un visage au parcours d'adhésion : c'est
   * la gérante de Zafy Design (m10), dont la candidature attend d'être examinée.
   */
  public: {
    id: "u-visiteur",
    role: "visiteur",
    space: "public",
    memberId: "m10",
    nom: "Hasina Rakotoarisoa",
    fonction: "Gérante · Zafy Design",
    email: "hasina@zafydesign.mg",
    tel: "+261 34 77 889 90",
    initiales: "HR",
    photo:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&q=80&auto=format&fit=crop&crop=faces",
  },

  /** Espace membre — représentante d'une entreprise adhérente à jour (m1). */
  membre: {
    id: "u-membre",
    role: "membre",
    space: "membre",
    memberId: "m1",
    nom: "Voninkazo Andriamampianina",
    fonction: "Directrice Générale",
    email: "contact@biosudessences.mg",
    tel: "+261 34 12 345 67",
    initiales: "VA",
    photo:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&q=80&auto=format&fit=crop&crop=faces",
  },

  /** Espace admin — équipe CanCham, rattachée à aucune entreprise. */
  admin: {
    id: "u-admin",
    role: "admin",
    space: "admin",
    memberId: null,
    nom: "Ando Ratovomanana",
    fonction: "Direction exécutive",
    email: "ando.ratovomanana@cancham.mg",
    tel: "+261 32 00 112 23",
    initiales: "AR",
    photo:
      "https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400&h=400&q=80&auto=format&fit=crop&crop=faces",
  },
};

/**
 * Utilisateur courant, déduit de l'espace.
 *
 * Point d'entrée unique à remplacer le jour où l'on branche l'authentification.
 */
export function getCurrentUser(space: Space): User {
  return USERS[space];
}

/**
 * Les autres personnes à joindre chez un membre.
 *
 * Elles peuplent le bloc « Contacts » de la fiche entreprise. Ce sont des
 * utilisateurs comme les autres : quelqu'un que la chambre peut appeler est
 * quelqu'un à qui l'on ouvrira un accès le jour venu. Aucune ne porte
 * `contactPrincipal` — ce rôle est déjà tenu par l'utilisateur de l'espace.
 */
export const CONTACTS: {
  id: string;
  memberId: string;
  nom: string;
  fonction: string;
  email: string;
  tel: string | null;
  photo: string | null;
}[] = [
  {
    id: "u-m1-export",
    memberId: "m1",
    nom: "Tahiry Rakotomalala",
    fonction: "Responsable export",
    email: "export@biosudessences.mg",
    tel: "+261 34 12 345 68",
    photo:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&q=80&auto=format&fit=crop&crop=faces",
  },
  {
    id: "u-m1-qualite",
    memberId: "m1",
    nom: "Noro Rasoanaivo",
    fonction: "Qualité & certification",
    email: "qualite@biosudessences.mg",
    tel: "+261 32 44 556 67",
    photo:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&q=80&auto=format&fit=crop&crop=faces",
  },
];
