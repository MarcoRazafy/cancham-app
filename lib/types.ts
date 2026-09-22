import type { Devise, FormuleId } from "@/lib/membership";
/**
 * Modèle de domaine CanCham Connect.
 *
 * Ces types sont dessinés pour se traduire terme à terme en schéma Prisma
 * quand la persistance arrivera : chaque interface = un modèle, chaque union
 * de chaînes = un enum.
 *
 * Différence majeure avec le prototype HTML : `Member` (l'entreprise adhérente)
 * et `User` (la personne qui se connecte) sont deux entités distinctes. Le
 * prototype les confondait dans un seul objet via les champs `rep`/`repTitre`.
 */

/** Statut d'adhésion d'un membre. Pilote l'accès à toute l'application. */
export type MemberStatus =
  | "candidature" // demande déposée, pas encore examinée
  | "en_attente" // approuvée, en attente du paiement de la cotisation
  | "a_jour" // cotisation réglée
  | "en_retard"; // cotisation non renouvelée

/** Une entreprise adhérente, ou un indépendant (personne physique). */
export type MemberType = "morale" | "physique";

/** Espace auquel un utilisateur a accès. */
export type Space = "public" | "membre" | "admin";

/**
 * Rôle applicatif. Sans authentification pour l'instant : sert uniquement à
 * afficher le bon profil de démonstration dans chaque espace.
 */
export type UserRole =
  | "visiteur" // espace public, non authentifié
  | "membre" // représentant d'une entreprise adhérente
  | "admin"; // équipe CanCham

/**
 * Dans l'équipe : l'administrateur a le contrôle total ; le manager a tout,
 * sauf ouvrir, retirer ou changer les accès de l'équipe.
 */
export type NiveauEquipe = "administrateur" | "manager";

export interface User {
  id: string;
  role: UserRole;
  /** Pour l'équipe seulement ; `null` pour les membres et les visiteurs. */
  niveauEquipe: NiveauEquipe | null;
  space: Space;
  /** Rattachement à une entreprise. `null` pour l'équipe CanCham et les visiteurs. */
  memberId: string | null;
  nom: string;
  fonction: string;
  email: string;
  tel?: string;
  /** Initiales calculées d'avance pour l'avatar, en repli de `photo`. */
  initiales: string;
  /** Portrait de l'utilisateur, par URL. */
  photo?: string | null;
}

/** Produit ou service mis en avant sur la fiche membre. */
export interface Produit {
  /** Absent dans le jeu de démonstration, qui n'a pas encore d'identifiants. */
  id?: string;
  /** Titre de l'offre. */
  label: string;
  type?: "produit" | "service";
  /** Ce que l'offre comprend, pour qui, à quelles conditions. */
  description?: string | null;
  /** Prix indicatif, en clair : « 25 000 Ar le flacon », « Sur devis ». */
  prix?: string | null;
  /**
   * Galerie du produit, dans l'ordre d'affichage. La première sert de vignette
   * partout où une seule image tient. Vide = dégradé décoratif généré.
   */
  photos: string[];
}

export interface Member {
  id: string;
  type: MemberType;
  nom: string;
  secteur: string;
  ville: string;
  statut: MemberStatus;
  /** Formule choisie à l'inscription. Elle fixe la cotisation. */
  formule: FormuleId;
  /** Date d'adhésion, ISO court (YYYY-MM-DD). */
  adhesion: string;
  /** Date de bascule en retard. Sert à calculer les jours de retard à la volée. */
  retardDepuis: string | null;
  /** Description courte, affichée en tête de fiche. */
  activite: string;
  /** Description détaillée. */
  desc: string;
  /** Ce que le membre recherche — moteur de la mise en relation. */
  besoins?: string;
  /** Secteurs ou collaborations qui l'intéressent. */
  interets?: string;
  produits: Produit[];
  /** Renseignés à la candidature, consultés par l'admin. */
  statutJuridique?: string;
  pays?: string;
  siteweb?: string;
  motivation?: string;
  /** Trace du dernier règlement enregistré. */
  paiementNote?: string;
  /** Photo de couverture de la fiche, par URL. */
  cover?: string | null;
  /** Vignette ronde : portrait si personne physique, visuel sinon. */
  photo?: string | null;
  /** Logo de l'organisation. Prime sur `photo` partout où l'on identifie le membre. */
  logo?: string | null;
  /** Inscription pas encore complétée : l'accueil pas à pas reste à finir. */
  accueilEnCours?: boolean;
}

export type EventFormat = "Présentiel" | "Webinaire" | "Hybride";

export interface CanchamEvent {
  id: string;
  titre: string;
  /** ISO court (YYYY-MM-DD). */
  date: string;
  lieu: string;
  format: EventFormat;
  cap: number;
  inscrits: number;
  /** Payant pour les membres. */
  payant: boolean;
  /** Tarif membre, en Ariary. */
  prix: number;
  /** Diffusé aussi sur la page publique ; sinon, réservé à la plateforme. */
  public: boolean;
  /** Tarif d'une inscription depuis la page publique, en Ariary. 0 = gratuite. */
  prixPublic: number;
  desc: string;
  photo: string | null;
  /** Heure de début, « HH:MM ». `null` = toute la journée. */
  debut?: string | null;
  /** Heure de fin, « HH:MM ». */
  fin?: string | null;
  /** À qui l'événement s'adresse en priorité. */
  pourQui?: string | null;
  /** Déroulé de la séance, dans l'ordre. */
  programme?: EtapeProgramme[];
}

/** Une étape du déroulé d'un événement. */
export interface EtapeProgramme {
  heure: string;
  titre: string;
  detail?: string | null;
}

export type AttendeeStatus = "confirmé" | "présent" | "absent";

export interface Attendee {
  id: string;
  eventId: string;
  nom: string;
  entreprise: string;
  email: string;
  statut: AttendeeStatus;
  /** Code d'accès présenté à l'accueil. */
  code: string;
}

export type NewsCategory =
  "Programmation" | "Événement passé" | "Vie de la chambre" | "Formation";

export interface NewsMedia {
  type: "image" | "video";
  theme: "navy" | "green";
  duration?: string;
}

export interface Comment {
  id: string;
  auteur: string;
  entreprise: string;
  texte: string;
  date: string;
  /** Écrit par l'utilisateur courant : lui seul le modifie ou le supprime. */
  moi: boolean;
  /** Texte retouché par son auteur après publication. */
  modifie: boolean;
  jaimes: number;
  jaimeParMoi: boolean;
}

/** Commentaire tel que le décrivent les données d'exemple. */
export type CommentaireFixture = Pick<
  Comment,
  "id" | "auteur" | "entreprise" | "texte" | "date"
>;

export interface NewsItem {
  id: string;
  titre: string;
  date: string;
  cat: NewsCategory;
  media: NewsMedia;
  extrait: string;
  corps: string;
  /** Photos de l'article, dans l'ordre ; la première sert de couverture. */
  images: string[];
  /** Diffusée aussi sur la page publique ; sinon, réservée aux membres. */
  public: boolean;
  commentaires: Comment[];
  /** Nombre de « j'aime ». */
  jaimes: number;
  /** L'utilisateur courant a-t-il déjà aimé ? Faux quand on ne sait pas qui regarde. */
  jaimeParMoi: boolean;
}

/** Promotion publiée PAR un membre, à destination des autres membres. */
export interface Offer {
  id: string;
  membreId: string;
  membre: string;
  titre: string;
  desc: string;
  /** Visuel propre à l'offre, choisi par l'équipe. */
  image?: string | null;
  /** Ce que la carte affiche : le visuel de l'offre, sinon la couverture de l'entreprise. */
  cover?: string | null;
}

/** Service proposé PAR la chambre à ses membres. À ne pas confondre avec Offer. */
export interface CanchamService {
  id: string;
  titre: string;
  desc: string;
  type: "gratuit" | "payant";
  /** En Ariary. 0 si gratuit. */
  prix: number;
  icon: string;
  /** Photo de couverture de la carte. `null` = dégradé aux couleurs du type. */
  image: string | null;
}

export type ResourceCategory = "Guide" | "Modèle" | "Formation" | "Rapport";

export interface Resource {
  id: string;
  titre: string;
  cat: ResourceCategory;
  fmt: "PDF" | "DOCX" | "Vidéo";
  taille: string;
  date: string;
  /** Accès inclus dans l'adhésion, ou facturé en supplément. */
  type: "gratuit" | "payant";
  /** En Ariary. 0 si gratuit. */
  prix: number;
  commentaires: Comment[];
  /** Visuel de la carte. `null` = motif décoratif. */
  cover?: string | null;
  /** Fichier converti et lisible dans la plateforme. */
  pret?: boolean;
}

export type InvoiceStatus = "payee" | "envoyee";

export interface Invoice {
  id: string;
  numero: string;
  date: string;
  objet: string;
  /** Montant en unités entières de `devise`. */
  montant: number;
  devise: Devise;
  statut: InvoiceStatus;
  /** `null` quand le membre a été supprimé : la facture, elle, reste. */
  membreId: string | null;
  membre: string;
}

export interface Message {
  id: string;
  de: string;
  /** `true` si l'auteur est l'utilisateur courant. */
  moi: boolean;
  texte: string;
  /** Forme abrégée : « 14:32 » aujourd'hui, « Hier », « Lundi », « 12 sept. ». */
  heure: string;
  /** Horodatage ISO. La vue en tire l'heure exacte et le regroupement par jour. */
  envoyeLe: string;
  /** Images, vidéos et PDF joints. Un message peut n'avoir que des pièces. */
  pieces: PieceJointe[];
  /** Texte retouché par son auteur après l'envoi. */
  modifie: boolean;
  /** Supprimé par son auteur : ni texte ni pièces, seulement la trace. */
  supprime: boolean;
  /** Copie d'un message venu d'une autre conversation. */
  transfere: boolean;
}

/** Une personne d'un fil, ou à qui l'on peut écrire. */
export interface Personne {
  id: string;
  nom: string;
  fonction: string;
  /** Entreprise, ou « Équipe CanCham » pour la chambre. */
  entreprise: string;
  photo: string | null;
}

export interface MessageThread {
  id: string;
  type: "individuel" | "groupe";
  /** Assistance entre un membre et l'équipe CanCham. */
  equipe: boolean;
  /** Ce que voit l'utilisateur courant : l'autre personne, le groupe, la chambre. */
  nom: string;
  sousTitre: string;
  init: string;
  /** Visuel du fil, par URL. Les initiales servent de repli. */
  avatar?: string | null;
  /** Entreprise en face, avec son nom : le panneau d'information y renvoie. */
  membre?: { id: string; nom: string; siteweb: string | null } | null;
  /** Personne en face, pour le panneau d'information. */
  contact?: {
    id: string;
    nom: string;
    fonction: string;
    email: string;
    tel: string | null;
    photo: string | null;
  } | null;
  /** Tous les participants, utilisateur courant compris. */
  participants: Personne[];
  /** Messages des autres arrivés depuis la dernière ouverture du fil. */
  unread: number;
  messages: Message[];
}

/** Fichier joint à un message. */
export interface PieceJointe {
  id: string;
  nom: string;
  type: "image" | "video" | "pdf";
  /** Poids en octets. */
  taille: number;
}

/** Inscription d'un membre à un événement. */
export interface Registration {
  eventId: string;
  memberId: string;
  code: string;
  date: string;
  /** Les personnes inscrites par l'entreprise, chacune avec son code d'accueil. */
  representants?: { nom: string; code: string }[];
}

/**
 * Une personne à joindre chez un membre.
 *
 * C'est la même table que les utilisateurs : quelqu'un qu'on peut appeler est
 * quelqu'un à qui l'on ouvrira un accès le jour où l'authentification arrivera.
 * Dupliquer la notion nous aurait laissés avec deux annuaires à réconcilier.
 */
export interface Contact {
  id: string;
  nom: string;
  fonction: string;
  email: string;
  tel: string | null;
  photo: string | null;
  /** Le référent de l'entreprise auprès de la chambre. Un seul par membre. */
  principal: boolean;
  /** Invité, sans mot de passe choisi : il ne s'est jamais connecté. */
  invitationEnAttente: boolean;
}
