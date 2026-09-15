import type { Member, Produit } from "../../lib/types";

/** Raccourci : un produit sans photo, rendu par un dégradé décoratif. */
const p = (label: string): Produit => ({ label, photo: null });

/**
 * Données d'exemple. Entreprises et personnes fictives, destinées à illustrer
 * le fonctionnement de l'application.
 *
 * La répartition des statuts est choisie pour que chaque cas de figure du
 * cycle d'adhésion soit visible à l'écran :
 *   - m4  : en attente de paiement (accès verrouillé)
 *   - m8  : en retard de plus de 30 jours (accès verrouillé automatiquement)
 *   - m10 : candidature fraîche, à examiner par l'équipe CanCham
 */
export const MEMBERS: Member[] = [
  {
    id: "m1",
    type: "morale",
    nom: "Bio Sud Essences",
    secteur: "Huiles essentielles & produits naturels",
    ville: "Toliara",
    statut: "a_jour",
    adhesion: "2021-03-14",
    retardDepuis: null,
    activite: "Distillation et export d’huiles essentielles biologiques.",
    desc: "Distillation et export d’huiles essentielles biologiques (girofle, ravintsara, niaouli) vers l’Amérique du Nord et l’Europe.",
    besoins:
      "Recherche un distributeur bio établi au Québec pour ses huiles essentielles et cosmétiques naturels.",
    interets:
      "Partenariats avec des marques de cosmétique naturelle ou de bien-être canadiennes.",
    cover:
      "https://images.unsplash.com/photo-1556760544-74068565f05c?w=1200&q=80&auto=format&fit=crop",
    photo:
      "https://images.unsplash.com/photo-1556760544-74068565f05c?w=400&h=400&q=80&auto=format&fit=crop&crop=entropy",
    produits: [p("Ravintsara BIO"), p("Coffret découverte"), p("Girofle vapeur")],
  },
  {
    id: "m2",
    type: "morale",
    nom: "Highlands Artisanat",
    secteur: "Artisanat & savoir-faire malgache",
    ville: "Antananarivo",
    statut: "a_jour",
    adhesion: "2019-09-02",
    retardDepuis: null,
    activite: "Coopérative de tisserands et sculpteurs sur bois précieux.",
    desc: "Coopérative de tisserands et sculpteurs sur bois précieux, gamme premium pour le marché canadien.",
    cover:
      "https://images.unsplash.com/photo-1590751518505-1fc2d227ef9b?w=1200&q=80&auto=format&fit=crop",
    photo:
      "https://images.unsplash.com/photo-1590751518505-1fc2d227ef9b?w=400&h=400&q=80&auto=format&fit=crop&crop=entropy",
    produits: [p("Panier raphia XL"), p("Sculpture palissandre"), p("Textile lamba")],
  },
  {
    id: "m3",
    type: "morale",
    nom: "Tsara Voyages",
    secteur: "Tourisme & voyagisme",
    ville: "Antananarivo",
    statut: "a_jour",
    adhesion: "2022-06-20",
    retardDepuis: null,
    activite: "Agence réceptive spécialisée circuits nature et écotourisme.",
    desc: "Agence réceptive spécialisée circuits nature et écotourisme, partenaire d’opérateurs québécois.",
    besoins:
      "À la recherche d’un partenaire réceptif basé au Canada pour des offres croisées.",
    interets:
      "Collaboration avec des tour-opérateurs spécialisés en écotourisme et voyage responsable.",
    cover:
      "https://images.unsplash.com/photo-1749585071939-4cd62be90967?w=1200&h=800&q=80&auto=format&fit=crop",
    photo:
      "https://images.unsplash.com/photo-1749585071939-4cd62be90967?w=400&h=400&h=800&q=80&auto=format&fit=crop&crop=entropy",
    produits: [p("Circuit Andasibe 5j"), p("Séjour Nosy Be"), p("Trek Isalo")],
  },
  {
    id: "m4",
    type: "morale",
    nom: "Sahanala Agro",
    secteur: "Agroalimentaire & export",
    ville: "Antsirabe",
    statut: "en_attente",
    adhesion: "2020-01-11",
    retardDepuis: null,
    activite: "Transformation de fruits et épices pour la distribution spécialisée.",
    desc: "Transformation de fruits et épices, ligne de confitures et poivres pour la distribution spécialisée.",
    cover:
      "https://images.unsplash.com/photo-1682482198446-4cbf92f85a4b?w=1200&q=80&auto=format&fit=crop",
    photo:
      "https://images.unsplash.com/photo-1682482198446-4cbf92f85a4b?w=400&h=400&q=80&auto=format&fit=crop&crop=entropy",
    produits: [
      p("Poivre sauvage Voatsiperifery"),
      p("Confiture litchi"),
      p("Vanille gousses"),
    ],
  },
  {
    id: "m5",
    type: "morale",
    nom: "MadaTech Solutions",
    secteur: "Technologie & BPO",
    ville: "Antananarivo",
    statut: "a_jour",
    adhesion: "2023-02-08",
    retardDepuis: null,
    activite: "Centre de services numériques francophone.",
    desc: "Centre de services numériques francophone : annotation de données, support client, développement logiciel.",
    besoins:
      "Cherche des clients canadiens pour des mandats d’annotation de données ou de développement logiciel.",
    interets:
      "Échanges avec d’autres membres du secteur technologie et centres de services partagés.",
    cover:
      "https://images.pexels.com/photos/7988116/pexels-photo-7988116.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    photo:
      "https://images.pexels.com/photos/7988116/pexels-photo-7988116.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&h=800&fit=crop&crop=entropy",
    produits: [p("Annotation IA"), p("Centre d’appel FR"), p("Développement sur mesure")],
  },
  {
    id: "m6",
    type: "morale",
    nom: "Terres Rouges Mines",
    secteur: "Ressources & mines",
    ville: "Antananarivo",
    statut: "a_jour",
    adhesion: "2018-11-30",
    retardDepuis: null,
    activite: "Extraction et négoce de pierres fines et minéraux industriels.",
    desc: "Extraction et négoce de pierres fines et minéraux industriels, conformité ESG en cours de certification.",
    cover:
      "https://images.unsplash.com/photo-1627289601745-5813e24c9bc1?w=1200&q=80&auto=format&fit=crop",
    photo:
      "https://images.unsplash.com/photo-1627289601745-5813e24c9bc1?w=400&h=400&q=80&auto=format&fit=crop&crop=entropy",
    produits: [p("Béryl brut"), p("Quartz industriel"), p("Grenat calibré")],
  },
  {
    id: "m7",
    type: "morale",
    nom: "Fandresena Finance",
    secteur: "Services financiers",
    ville: "Antananarivo",
    statut: "a_jour",
    adhesion: "2021-07-19",
    retardDepuis: null,
    activite: "Conseil en structuration financière et accompagnement export.",
    desc: "Conseil en structuration financière et accompagnement des PME malgaches à l’export.",
    cover:
      "https://images.unsplash.com/photo-1758518730384-be3d205838e8?w=1200&h=800&q=80&auto=format&fit=crop",
    photo:
      "https://images.unsplash.com/photo-1758518730384-be3d205838e8?w=400&h=400&h=800&q=80&auto=format&fit=crop&crop=entropy",
    produits: [p("Montage export"), p("Ligne de crédit PME"), p("Audit financier")],
  },
  {
    id: "m8",
    type: "morale",
    nom: "Institut Vola Formation",
    secteur: "Éducation & formation professionnelle",
    ville: "Antananarivo",
    statut: "en_retard",
    adhesion: "2020-05-05",
    retardDepuis: "2026-07-01",
    activite: "Organisme de formation continue en gestion et commerce international.",
    desc: "Organisme de formation continue en gestion, commerce international et langues, partenaire d’entreprises membres.",
    cover:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&q=80&auto=format&fit=crop",
    photo:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=400&q=80&auto=format&fit=crop&crop=entropy",
    produits: [
      p("Formation export"),
      p("Cours de français affaires"),
      p("Atelier gestion de projet"),
    ],
  },
  {
    id: "m9",
    type: "physique",
    nom: "Mialy Razanadrakoto",
    secteur: "Conseil en développement international",
    ville: "Antananarivo",
    statut: "a_jour",
    adhesion: "2024-03-01",
    retardDepuis: null,
    activite: "Consultante indépendante en accompagnement à l’export.",
    desc: "Consultante indépendante en accompagnement à l’export et montage de partenariats Canada-Madagascar, pour PME et porteurs de projet.",
    besoins:
      "Recherche des mandats ponctuels auprès de PME malgaches en démarche d’internationalisation.",
    interets:
      "Mise en réseau avec des consultants et cabinets-conseils canadiens actifs en Afrique.",
    cover:
      "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=1200&q=80&auto=format&fit=crop",
    photo:
      "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&q=80&auto=format&fit=crop&crop=faces",
    produits: [
      p("Accompagnement export"),
      p("Montage de partenariat"),
      p("Coaching porteur de projet"),
    ],
  },
  {
    id: "m10",
    type: "morale",
    nom: "Zafy Design",
    secteur: "Design & aménagement intérieur",
    ville: "Antananarivo",
    statut: "candidature",
    adhesion: "2026-09-05",
    retardDepuis: null,
    activite: "Studio de design mobilier en matériaux locaux.",
    desc: "Studio de design spécialisé dans le mobilier contemporain en raphia, bois et fibres locales, pour l’hôtellerie et la décoration haut de gamme.",
    besoins:
      "Cherche à identifier des acheteurs canadiens dans l’hôtellerie et la décoration d’intérieur.",
    interets:
      "Participation aux missions économiques et aux salons professionnels au Canada.",
    statutJuridique: "SARL",
    pays: "Madagascar",
    siteweb: "https://www.zafydesign.mg",
    motivation:
      "Nous souhaitons rejoindre CanCham pour accéder au réseau d’acheteurs canadiens et bénéficier de l’accompagnement à l’export. Notre production est prête pour l’exportation mais nous manquons de contacts qualifiés sur le marché nord-américain.",
    cover:
      "https://images.unsplash.com/photo-1597960194599-22929afc25b1?w=1200&q=80&auto=format&fit=crop",
    photo:
      "https://images.unsplash.com/photo-1597960194599-22929afc25b1?w=400&h=400&q=80&auto=format&fit=crop&crop=entropy",
    produits: [p("Fauteuil raphia"), p("Table basse palissandre"), p("Luminaire fibres")],
  },
];

export function findMember(id: string): Member | undefined {
  return MEMBERS.find((m) => m.id === id);
}
