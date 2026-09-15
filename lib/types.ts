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

export interface User {
  id: string;
  role: UserRole;
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
  label: string;
  /** Chemin vers une image. `null` = dégradé décoratif généré. */
  photo: string | null;
}

export interface Member {
  id: string;
  type: MemberType;
  nom: string;
  secteur: string;
  ville: string;
  statut: MemberStatus;
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
  payant: boolean;
  /** En Ariary. */
  prix: number;
  desc: string;
  photo: string | null;
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
  | "Programmation"
  | "Événement passé"
  | "Vie de la chambre"
  | "Formation";

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
}

export interface NewsItem {
  id: string;
  titre: string;
  date: string;
  cat: NewsCategory;
  media: NewsMedia;
  extrait: string;
  corps: string;
  /** Illustration de l'article, par URL. */
  image?: string | null;
  commentaires: Comment[];
}

/** Promotion publiée PAR un membre, à destination des autres membres. */
export interface Offer {
  id: string;
  membreId: string;
  membre: string;
  titre: string;
  desc: string;
  /** Couverture de l'entreprise qui publie l'offre. */
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
}

export type InvoiceStatus = "payee" | "envoyee";

export interface Invoice {
  id: string;
  numero: string;
  date: string;
  objet: string;
  /** En Ariary. */
  montant: number;
  statut: InvoiceStatus;
  membreId: string;
  membre: string;
}

export interface Message {
  id: string;
  de: string;
  /** `true` si l'auteur est l'utilisateur courant. */
  moi: boolean;
  texte: string;
  heure: string;
}

export interface MessageThread {
  id: string;
  type: "individuel" | "groupe";
  nom: string;
  sousTitre: string;
  init: string;
  /** Visuel du fil, par URL. Les initiales servent de repli. */
  avatar?: string | null;
  unread: number;
  messages: Message[];
}

/** Inscription d'un membre à un événement. */
export interface Registration {
  eventId: string;
  memberId: string;
  code: string;
  date: string;
}
