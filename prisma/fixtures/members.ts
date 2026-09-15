import type { Member, Produit } from "../../lib/types";

/** Raccourci : un produit sans photo, rendu par un dégradé décoratif. */
/**
 * Un produit du catalogue d'un membre.
 *
 * La photo est facultative : sans elle, la vignette retombe sur le dégradé
 * décoratif de `PhotoPlaceholder`.
 */
const p = (label: string, photo: string | null = null): Produit => ({
  label,
  photo,
});

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
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=450&q=80&auto=format&fit=crop",
    produits: [
      p(
        "Ravintsara BIO",
        "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=450&q=80&auto=format&fit=crop",
      ),
      p(
        "Coffret découverte",
        "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=600&h=450&q=80&auto=format&fit=crop",
      ),
      p(
        "Girofle vapeur",
        "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=450&q=80&auto=format&fit=crop",
      ),
    ],
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
      "https://images.pexels.com/photos/29193598/pexels-photo-29193598.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
    produits: [
      p(
        "Panier raphia XL",
        "https://images.pexels.com/photos/29193598/pexels-photo-29193598.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
      ),
      p(
        "Sculpture palissandre",
        "https://images.pexels.com/photos/18758710/pexels-photo-18758710.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
      ),
      p(
        "Textile lamba",
        "https://images.pexels.com/photos/6634465/pexels-photo-6634465.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
      ),
    ],
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
      "https://images.pexels.com/photos/18852638/pexels-photo-18852638.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
    produits: [
      p(
        "Circuit Andasibe 5j",
        "https://images.pexels.com/photos/18852638/pexels-photo-18852638.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
      ),
      p(
        "Séjour Nosy Be",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=450&q=80&auto=format&fit=crop",
      ),
      p(
        "Trek Isalo",
        "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=600&h=450&q=80&auto=format&fit=crop",
      ),
    ],
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
    activite:
      "Transformation de fruits et épices pour la distribution spécialisée.",
    desc: "Transformation de fruits et épices, ligne de confitures et poivres pour la distribution spécialisée.",
    cover:
      "https://images.unsplash.com/photo-1682482198446-4cbf92f85a4b?w=1200&q=80&auto=format&fit=crop",
    photo:
      "https://images.pexels.com/photos/31717561/pexels-photo-31717561.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
    produits: [
      p(
        "Poivre sauvage Voatsiperifery",
        "https://images.pexels.com/photos/31717561/pexels-photo-31717561.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
      ),
      p(
        "Confiture litchi",
        "https://images.pexels.com/photos/9160297/pexels-photo-9160297.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
      ),
      p(
        "Vanille gousses",
        "https://images.pexels.com/photos/14381802/pexels-photo-14381802.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
      ),
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
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=450&q=80&auto=format&fit=crop",
    produits: [
      p(
        "Annotation IA",
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=450&q=80&auto=format&fit=crop",
      ),
      p(
        "Centre d’appel FR",
        "https://images.unsplash.com/photo-1560264280-88b68371db39?w=600&h=450&q=80&auto=format&fit=crop",
      ),
      p(
        "Développement sur mesure",
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=450&q=80&auto=format&fit=crop",
      ),
    ],
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
      "https://images.pexels.com/photos/6806371/pexels-photo-6806371.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
    produits: [
      p(
        "Béryl brut",
        "https://images.pexels.com/photos/6806371/pexels-photo-6806371.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
      ),
      p(
        "Quartz industriel",
        "https://images.pexels.com/photos/4028957/pexels-photo-4028957.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
      ),
      p(
        "Grenat calibré",
        "https://images.pexels.com/photos/8581107/pexels-photo-8581107.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
      ),
    ],
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
      "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=600&h=450&q=80&auto=format&fit=crop",
    produits: [
      p(
        "Montage export",
        "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=600&h=450&q=80&auto=format&fit=crop",
      ),
      p(
        "Ligne de crédit PME",
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=450&q=80&auto=format&fit=crop",
      ),
      p(
        "Audit financier",
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=450&q=80&auto=format&fit=crop",
      ),
    ],
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
    activite:
      "Organisme de formation continue en gestion et commerce international.",
    desc: "Organisme de formation continue en gestion, commerce international et langues, partenaire d’entreprises membres.",
    cover:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&q=80&auto=format&fit=crop",
    photo:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=450&q=80&auto=format&fit=crop",
    produits: [
      p(
        "Formation export",
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=450&q=80&auto=format&fit=crop",
      ),
      p(
        "Cours de français affaires",
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=450&q=80&auto=format&fit=crop",
      ),
      p(
        "Atelier gestion de projet",
        "https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?w=600&h=450&q=80&auto=format&fit=crop",
      ),
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
      p(
        "Accompagnement export",
        "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600&h=450&q=80&auto=format&fit=crop",
      ),
      p(
        "Montage de partenariat",
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=450&q=80&auto=format&fit=crop",
      ),
      p(
        "Coaching porteur de projet",
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=450&q=80&auto=format&fit=crop",
      ),
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
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=450&q=80&auto=format&fit=crop",
    produits: [
      p(
        "Fauteuil raphia",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=450&q=80&auto=format&fit=crop",
      ),
      p(
        "Table basse palissandre",
        "https://images.pexels.com/photos/19370207/pexels-photo-19370207.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
      ),
      p(
        "Luminaire fibres",
        "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=450&q=80&auto=format&fit=crop",
      ),
    ],
  },
];

export function findMember(id: string): Member | undefined {
  return MEMBERS.find((m) => m.id === id);
}
