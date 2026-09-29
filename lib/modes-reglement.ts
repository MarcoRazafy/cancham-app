/**
 * Les moyens de règlement de la chambre.
 *
 * Ce module ne touche ni à la base ni au serveur : la liste est lue aussi
 * bien par les pages que par les fenêtres de saisie, qui tournent dans le
 * navigateur. Ce qui a besoin de PostgreSQL vit dans `lib/reglements.ts`,
 * qui reprend tout ce qui est ici.
 *
 * Deux familles. La carte et les portefeuilles s'encaissent tout seuls, par
 * le prestataire : la plateforme apprend le paiement sans que personne n'ait
 * rien à faire. Les autres se passent hors ligne — la plateforme donne les
 * coordonnées et une référence à recopier, le membre annonce qu'il a payé,
 * et c'est l'équipe qui constate l'arrivée de l'argent.
 *
 * Un moyen dont les coordonnées manquent n'est pas proposé : mieux vaut un
 * choix plus court qu'un virement envoyé dans le vide.
 */

export type ModeReglement =
  | "mvola"
  | "orange_money"
  | "airtel_money"
  | "virement"
  | "depot"
  | "especes"
  | "carte"
  | "plateforme";

export interface DescriptionMode {
  titre: string;
  detail: string;
  /** Encaissé par le prestataire, sans intervention de l'équipe. */
  enLigne: boolean;
}

/**
 * Les trois opérateurs sont distincts, et non un « mobile money » unique :
 * on ne paie pas chez Telma avec un compte Orange, et le membre choisit le
 * portefeuille qu'il a dans la poche.
 */
export const MODES: Record<ModeReglement, DescriptionMode> = {
  mvola: {
    titre: "MVola",
    detail: "Portefeuille Telma. Validation sur votre téléphone.",
    enLigne: true,
  },
  orange_money: {
    titre: "Orange Money",
    detail: "Portefeuille Orange. Validation sur votre téléphone.",
    enLigne: true,
  },
  airtel_money: {
    titre: "Airtel Money",
    detail: "Portefeuille Airtel. Validation sur votre téléphone.",
    enLigne: true,
  },
  virement: {
    titre: "Virement bancaire",
    detail: "Depuis votre banque, vers le compte de la chambre.",
    enLigne: false,
  },
  depot: {
    titre: "Dépôt bancaire",
    detail: "Espèces déposées au guichet, avec un bordereau pré-rempli.",
    enLigne: false,
  },
  especes: {
    titre: "Espèces",
    detail: "Remise en main propre à l’équipe, contre reçu.",
    enLigne: false,
  },
  carte: {
    titre: "Carte bancaire",
    detail: "Visa, Mastercard. Paiement immédiat, sur la page du prestataire.",
    enLigne: true,
  },
  plateforme: {
    titre: "Plateformes de paiement",
    detail: "PayPal, Wise et consorts.",
    enLigne: false,
  },
};

export const ORDRE_MODES = Object.keys(MODES) as ModeReglement[];

export function estModeReglement(v: string): v is ModeReglement {
  return (ORDRE_MODES as string[]).includes(v);
}

/** Les portefeuilles mobiles, qui se règlent depuis un téléphone. */
export function estPortefeuille(mode: ModeReglement): boolean {
  return mode === "mvola" || mode === "orange_money" || mode === "airtel_money";
}

/** Les coordonnées de la chambre, avec leurs valeurs vides par défaut. */
export type Coordonnees = {
  titulaire: string;
  banque: string;
  agence: string;
  rib: string;
  iban: string;
  bic: string;
  mvola: string;
  orangeMoney: string;
  airtelMoney: string;
  adresseBureau: string;
  horaires: string;
  plateformes: string;
};

export const COORDONNEES_VIDES: Coordonnees = {
  titulaire: "",
  banque: "",
  agence: "",
  rib: "",
  iban: "",
  bic: "",
  mvola: "",
  orangeMoney: "",
  airtelMoney: "",
  adresseBureau: "",
  horaires: "",
  plateformes: "",
};

/** Le numéro où envoyer l'argent, pour un portefeuille mobile. */
export function numeroPortefeuille(
  mode: ModeReglement,
  c: Coordonnees,
): string {
  switch (mode) {
    case "mvola":
      return c.mvola;
    case "orange_money":
      return c.orangeMoney;
    case "airtel_money":
      return c.airtelMoney;
    default:
      return "";
  }
}

/**
 * Ce qu'il faut pour qu'un moyen soit proposable.
 *
 * La carte est toujours offerte : son écran se remplit sans le prestataire,
 * et c'est au moment de payer que le raccordement à Vanilla Pay est
 * vérifié — s'il manque, le membre l'apprend là, en clair.
 */
export function modeDisponible(mode: ModeReglement, c: Coordonnees): boolean {
  switch (mode) {
    case "carte":
      return true;
    // Les trois portefeuilles sont toujours offerts : la chambre les a tous,
    // et le membre choisit celui qu'il a en poche. Si le numéro de la
    // chambre n'est pas encore publié, l'écran du règlement le dit — ce qui
    // vaut mieux qu'une tuile disparue, que personne ne sait expliquer.
    case "mvola":
    case "orange_money":
    case "airtel_money":
      return true;
    case "virement":
      return Boolean(c.rib || c.iban);
    case "depot":
      return Boolean(c.rib && c.banque);
    case "especes":
      return Boolean(c.adresseBureau);
    case "plateforme":
      return Boolean(c.plateformes.trim());
  }
}
