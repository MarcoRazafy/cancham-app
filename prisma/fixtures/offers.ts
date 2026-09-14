import type { CanchamService, Offer } from "../../lib/types";

/**
 * Promotions publiées PAR les membres, à destination des autres membres.
 * Mises en avant sur le fil d'actualité.
 */
export const OFFERS: Offer[] = [
  {
    id: "o1",
    membreId: "m3",
    membre: "Tsara Voyages",
    titre: "-15% sur le circuit Andasibe 5 jours en octobre",
    desc: "Offre réservée aux membres CanCham et à leurs employés, valable pour toute réservation avant le 30 septembre.",
  },
  {
    id: "o2",
    membreId: "m1",
    membre: "Bio Sud Essences",
    titre: "Coffret découverte offert dès 3 cartons commandés",
    desc: "Pour toute commande groupée destinée à un événement CanCham (gala, 5 à 7, mission économique).",
  },
  {
    id: "o3",
    membreId: "m8",
    membre: "Institut Vola Formation",
    titre: "Une place gratuite sur l’atelier « Export vers le Canada »",
    desc: "Offerte par entreprise membre inscrite avant le 1er octobre, dans la limite des places disponibles.",
  },
];

/**
 * Services proposés PAR la chambre à ses membres, gratuits ou payants.
 *
 * À ne pas confondre avec `OFFERS` : ici c'est CanCham qui vend ou offre,
 * là ce sont les membres qui se font des promotions entre eux. La distinction
 * vient du prototype et structure deux pages différentes.
 */
export const SERVICES: CanchamService[] = [
  {
    id: "s1",
    titre: "Accès à l’annuaire des membres",
    desc: "Visibilité de votre fiche entreprise auprès de l’ensemble du réseau CanCham, avec mise en avant de vos produits et services.",
    type: "gratuit",
    prix: 0,
    icon: "users",
  },
  {
    id: "s2",
    titre: "Mise en relation avec des acheteurs canadiens",
    desc: "Identification et introduction auprès d’acheteurs et de partenaires potentiels au Canada, selon votre secteur d’activité.",
    type: "gratuit",
    prix: 0,
    icon: "award",
  },
  {
    id: "s3",
    titre: "Atelier de formation mensuel",
    desc: "Un atelier pratique par mois sur l’export, la mobilité ou la structuration d’entreprise, ouvert à tous les membres.",
    type: "gratuit",
    prix: 0,
    icon: "folder",
  },
  {
    id: "s4",
    titre: "Accompagnement personnalisé à l’export",
    desc: "Suivi individuel avec l’équipe CanCham pour structurer votre démarche d’accès au marché canadien : diagnostic, plan d’action et mise en relation ciblée.",
    type: "payant",
    prix: 350000,
    icon: "gauge",
  },
  {
    id: "s5",
    titre: "Stand à Canada Expo",
    desc: "Un emplacement dédié lors des étapes de la caravane Canada Expo, pour présenter vos produits directement aux visiteurs et acheteurs.",
    type: "payant",
    prix: 250000,
    icon: "building",
  },
  {
    id: "s6",
    titre: "Location de salle de réunion",
    desc: "Réservation de notre salle de réunion modulable au nouveau bureau CanCham pour vos rencontres avec clients ou partenaires.",
    type: "payant",
    prix: 80000,
    icon: "door",
  },
];
