import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ajouterJours,
  debutSemaine,
  estJourISO,
  grilleMois,
  periodeVoisine,
  plageHoraire,
  prochaineEcheanceCotisation,
} from "@/lib/agenda";
import { aujourdhuiISO, jourBase, jourSaisi } from "@/lib/format";

afterEach(() => vi.unstubAllEnvs());

describe("dates en base", () => {
  it("écrit le jour voulu, pas la veille", () => {
    // Minuit local à Antananarivo tombait la veille à 21 h UTC : Prisma
    // enregistrait le jour précédent. Minuit UTC garde le bon jour.
    expect(jourBase("2026-09-22").toISOString()).toBe(
      "2026-09-22T00:00:00.000Z",
    );
  });

  it("suit la date imposée pour une démonstration", () => {
    vi.stubEnv("CANCHAM_TODAY", "2026-10-01");
    expect(aujourdhuiISO()).toBe("2026-10-01");
    expect(jourBase().toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });

  it("refuse une date saisie invalide", () => {
    expect(jourSaisi("2026-09-22")).toBe("2026-09-22");
    expect(jourSaisi("22/09/2026")).toBeNull();
    expect(jourSaisi("")).toBeNull();
    expect(estJourISO("2026-02-30")).toBe(false);
  });
});

describe("calendrier de l'agenda", () => {
  it("commence les semaines le lundi", () => {
    expect(debutSemaine("2026-09-21")).toBe("2026-09-21"); // un lundi
    expect(debutSemaine("2026-09-27")).toBe("2026-09-21"); // le dimanche
  });

  it("couvre un mois de semaines complètes", () => {
    const grille = grilleMois("2026-09-15");
    expect(grille[0][0]).toBe("2026-08-31");
    expect(grille.at(-1)![6]).toBe("2026-10-04");
    expect(grille.every((s) => s.length === 7)).toBe(true);
  });

  it("passe les fins de mois et d'année", () => {
    expect(ajouterJours("2026-12-31", 1)).toBe("2027-01-01");
    expect(periodeVoisine("mois", "2026-01-31", 1)).toBe("2026-02-01");
  });

  it("écrit les heures comme la chambre", () => {
    expect(plageHoraire("17:30", "20:00")).toBe("17 h 30 – 20 h 00");
    expect(plageHoraire(null, null)).toBeNull();
  });
});

describe("renouvellement de la cotisation", () => {
  it("n'échoit pas l'année d'adhésion", () => {
    expect(
      prochaineEcheanceCotisation({
        aujourdhui: "2026-09-21",
        adhesion: "2026-03-10",
        anneesReglees: [],
        aJour: true,
      }),
    ).toBe("2027-01-31");
  });

  it("saute les années réglées", () => {
    expect(
      prochaineEcheanceCotisation({
        aujourdhui: "2026-01-10",
        adhesion: "2020-05-01",
        anneesReglees: [2026, 2027],
        aJour: true,
      }),
    ).toBe("2028-01-31");
  });

  it("garde l'échéance passée d'un membre qui n'a pas réglé", () => {
    expect(
      prochaineEcheanceCotisation({
        aujourdhui: "2026-09-21",
        adhesion: "2020-05-01",
        anneesReglees: [],
        aJour: false,
      }),
    ).toBe("2026-01-31");
  });
});
