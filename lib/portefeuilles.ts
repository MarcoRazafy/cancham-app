import type { ModeReglement } from "@/lib/modes-reglement";

export type Portefeuille = Extract<
  ModeReglement,
  "mvola" | "orange_money" | "airtel_money"
>;

export interface DescriptionPortefeuille {
  palette: {
    fond: string;
    encre: string;
    douce: string;
    valeur: string;
    bouton: string;
    surBouton: string;
    boutonSurvol: string;
  };
}

export const PORTEFEUILLES: Record<Portefeuille, DescriptionPortefeuille> = {
  mvola: {
    palette: {
      fond: "#ffde00",
      encre: "#10241a",
      douce: "#3c4a3f",
      valeur: "#ffde00",
      bouton: "#ffde00",
      surBouton: "#10241a",
      boutonSurvol: "#f2d000",
    },
  },
  orange_money: {
    palette: {
      fond: "#fe6601",
      encre: "#1c1008",
      douce: "#4a2d15",
      valeur: "#fe9247",
      bouton: "#fe6601",
      surBouton: "#000000",
      boutonSurvol: "#e85c00",
    },
  },
  airtel_money: {
    palette: {
      fond: "#ed1c24",
      encre: "#ffffff",
      douce: "#ffd8d9",
      valeur: "#ffd200",
      bouton: "#e0141c",
      surBouton: "#ffffff",
      boutonSurvol: "#c50f17",
    },
  },
};

export function estPortefeuilleConnu(m: ModeReglement): m is Portefeuille {
  return m === "mvola" || m === "orange_money" || m === "airtel_money";
}
