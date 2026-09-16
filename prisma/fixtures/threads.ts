

/**
 * Fils de discussion du membre de démonstration (m1).
 *
 * Forme d'entrée, distincte du modèle de vue : `heure` n'est qu'une indication
 * d'ancienneté relative, les horodatages réels sont calculés au chargement.
 */
export const THREADS: {
  id: string;
  type: "individuel" | "groupe";
  nom: string;
  sousTitre: string;
  init: string;
  avatar?: string | null;
  memberId?: string | null;
  unread: number;
  messages: { id: string; de: string; moi: boolean; texte: string; heure: string }[];
}[] = [
  {
    id: "t1",
    type: "individuel",
    nom: "Fanomezantsoa Randria",
    sousTitre: "Highlands Artisanat · Responsable Export",
    memberId: "m2",
    init: "FR",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&q=80&auto=format&fit=crop&crop=faces",
    unread: 2,
    messages: [
      {
        id: "msg1",
        de: "Fanomezantsoa Randria",
        moi: false,
        texte:
          "Bonjour ! Merci pour la mise en relation avec le distributeur de Longueuil, on avance bien sur le dossier.",
        heure: "10:12",
      },
      {
        id: "msg2",
        de: "moi",
        moi: true,
        texte: "Avec plaisir, tenez-moi au courant de la suite.",
        heure: "10:15",
      },
      {
        id: "msg3",
        de: "Fanomezantsoa Randria",
        moi: false,
        texte:
          "On vous envoie un point d’ici la fin du mois. Question rapide : le tarif préférentiel du prochain Canada Expo est bien confirmé pour les membres ?",
        heure: "10:16",
      },
    ],
  },
  {
    id: "t2",
    type: "individuel",
    nom: "Équipe CanCham",
    sousTitre: "Support membres · Fenomamy",
    init: "CC",
    avatar: "/photos/cancham-13.jpg",
    unread: 0,
    messages: [
      {
        id: "msg4",
        de: "Fenomamy",
        moi: false,
        texte: "Bonjour Voninkazo, votre facture CC-2026-0114 a bien été réglée, merci !",
        heure: "Hier",
      },
      {
        id: "msg5",
        de: "moi",
        moi: true,
        texte: "Merci à vous pour la confirmation rapide.",
        heure: "Hier",
      },
    ],
  },
  {
    id: "t3",
    type: "groupe",
    nom: "Comité MECC 9 — Tourisme & Éducation",
    sousTitre: "6 membres",
    init: "M9",
    avatar: "/photos/cancham-18.jpg",
    unread: 1,
    messages: [
      {
        id: "msg6",
        de: "Hery Rakotomalala",
        moi: false,
        texte:
          "Le dossier de candidature pour la délégation MECC 9 est à déposer avant le 20 septembre.",
        heure: "Lundi",
      },
      {
        id: "msg7",
        de: "Mirana Andriantsitohaina",
        moi: false,
        texte: "Merci pour le rappel, je m’en occupe cette semaine.",
        heure: "Lundi",
      },
      {
        id: "msg8",
        de: "moi",
        moi: true,
        texte: "Je confirme aussi notre intérêt pour une place dans la délégation.",
        heure: "Mardi",
      },
      {
        id: "msg9",
        de: "Fenomamy",
        moi: false,
        texte: "Bien noté, on revient vers vous avec la liste finale début octobre.",
        heure: "Mardi",
      },
    ],
  },
  {
    id: "t4",
    type: "groupe",
    nom: "Organisateurs 5 à 7 Réseautage",
    sousTitre: "4 membres",
    init: "57",
    avatar: "/photos/cancham-24.jpg",
    unread: 0,
    messages: [
      {
        id: "msg10",
        de: "Nirina Rabarijaona",
        moi: false,
        texte: "On garde le même format que la dernière fois pour le 22 septembre ?",
        heure: "Il y a 3 jours",
      },
      {
        id: "msg11",
        de: "moi",
        moi: true,
        texte: "Oui, ça a très bien fonctionné, on garde la même formule.",
        heure: "Il y a 3 jours",
      },
    ],
  },
];
