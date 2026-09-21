/**
 * Fils de discussion de démonstration.
 *
 * Les auteurs et les participants sont des identifiants d'utilisateurs : un
 * fil n'est visible que par ses participants. Les horodatages sont calculés au
 * chargement, du plus ancien au plus récent.
 */
export const THREADS: {
  id: string;
  type: "individuel" | "groupe";
  /** Nom d'un groupe ou de l'assistance. Un échange individuel n'en a pas. */
  nom?: string;
  avatar?: string;
  equipe?: boolean;
  participants: string[];
  /** Messages des autres que le membre de démonstration n'a pas encore lus. */
  nonLus: number;
  messages: { id: string; de: string; texte: string }[];
}[] = [
  {
    id: "t1",
    type: "individuel",
    participants: ["u-membre", "u-m2-export"],
    nonLus: 1,
    messages: [
      {
        id: "msg1",
        de: "u-m2-export",
        texte:
          "Bonjour ! Merci pour la mise en relation avec le distributeur de Longueuil, on avance bien sur le dossier.",
      },
      {
        id: "msg2",
        de: "u-membre",
        texte: "Avec plaisir, tenez-moi au courant de la suite.",
      },
      {
        id: "msg3",
        de: "u-m2-export",
        texte:
          "On vous envoie un point d’ici la fin du mois. Question rapide : le tarif préférentiel du prochain Canada Expo est bien confirmé pour les membres ? J’ai vu l’annonce sur https://www.facebook.com/CanChamMG.",
      },
    ],
  },
  {
    id: "t2",
    type: "individuel",
    nom: "Équipe CanCham",
    equipe: true,
    participants: ["u-membre", "u-admin"],
    nonLus: 0,
    messages: [
      {
        id: "msg4",
        de: "u-admin",
        texte:
          "Bonjour Voninkazo, votre facture CC-2026-0114 a bien été réglée, merci !",
      },
      {
        id: "msg5",
        de: "u-membre",
        texte: "Merci à vous pour la confirmation rapide.",
      },
    ],
  },
  {
    id: "t3",
    type: "groupe",
    nom: "Comité MECC 9 — Tourisme & Éducation",
    avatar: "/photos/cancham-18.jpg",
    participants: [
      "u-membre",
      "u-admin",
      "u-m3-3",
      "u-m9-12",
      "u-m5-6",
      "u-m7-9",
    ],
    nonLus: 1,
    messages: [
      {
        id: "msg6",
        de: "u-m3-3",
        texte:
          "Le dossier de candidature pour la délégation MECC 9 est à déposer avant le 20 septembre.",
      },
      {
        id: "msg7",
        de: "u-m9-12",
        texte: "Merci pour le rappel, je m’en occupe cette semaine.",
      },
      {
        id: "msg8",
        de: "u-membre",
        texte:
          "Je confirme aussi notre intérêt pour une place dans la délégation.",
      },
      {
        id: "msg9",
        de: "u-admin",
        texte:
          "Bien noté, on revient vers vous avec la liste finale début octobre.",
      },
    ],
  },
  {
    id: "t4",
    type: "groupe",
    nom: "Organisateurs 5 à 7 Réseautage",
    avatar: "/photos/cancham-24.jpg",
    participants: ["u-membre", "u-admin", "u-m6-8", "u-m8-11"],
    nonLus: 0,
    messages: [
      {
        id: "msg10",
        de: "u-m6-8",
        texte:
          "On garde le même format que la dernière fois pour le 22 septembre ?",
      },
      {
        id: "msg11",
        de: "u-membre",
        texte: "Oui, ça a très bien fonctionné, on garde la même formule.",
      },
    ],
  },
];
