import type { ModeReglement } from "@/lib/modes-reglement";

export type Portefeuille = Extract<
  ModeReglement,
  "mvola" | "orange_money" | "airtel_money"
>;

export interface DescriptionPortefeuille {
  operateur: string;
  ussd: string;
  prefixes: string[];
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
    operateur: "Telma",
    ussd: "#111#",
    prefixes: ["034", "038"],
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
    operateur: "Orange",
    ussd: "#144#",
    prefixes: ["032", "037"],
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
    operateur: "Airtel",
    ussd: "#436#",
    prefixes: ["033"],
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

export function normaliserNumero(saisi: string): string | null {
  const chiffres = saisi.replace(/[^\d]/g, "").replace(/^261/, "0");
  const dix = chiffres.startsWith("0") ? chiffres : `0${chiffres}`;
  return /^0\d{9}$/.test(dix) ? dix : null;
}

export function numeroDeLOperateur(
  mode: Portefeuille,
  numero: string,
): boolean {
  return PORTEFEUILLES[mode].prefixes.some((p) => numero.startsWith(p));
}

export function numeroLisible(numero: string): string {
  const n = normaliserNumero(numero);
  if (!n) return numero;
  return `${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
}
