import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ajouterJours,
  debutSemaine,
  estJourISO,
  grilleMois,
  periodeVoisine,
  plageHoraire,
  renouvellementCotisation,
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
  it("tombe un an après le dernier règlement, pas après l’inscription", () => {
    expect(
      renouvellementCotisation({
        adhesion: "2020-03-10",
        aJour: true,
        factures: [
          { date: "2025-09-19", objet: "Cotisation annuelle", statut: "payee" },
          { date: "2026-09-19", objet: "Cotisation annuelle", statut: "payee" },
          // Un événement payé entre-temps ne décale rien.
          {
            date: "2026-10-02",
            objet: "Participation — 5 à 7",
            statut: "payee",
          },
          // Une facture émise, pas encore réglée, non plus.
          {
            date: "2026-11-01",
            objet: "Cotisation annuelle",
            statut: "envoyee",
          },
        ],
      }),
    ).toBe("2027-09-19");
  });

  it("part de l’adhésion quand aucun règlement n’est enregistré", () => {
    expect(
      renouvellementCotisation({
        adhesion: "2026-02-28",
        aJour: true,
        factures: [],
      }),
    ).toBe("2027-02-28");
  });

  it("n’annonce rien tant que la première cotisation n’est pas réglée", () => {
    expect(
      renouvellementCotisation({
        adhesion: "2026-09-01",
        aJour: false,
        factures: [],
      }),
    ).toBeNull();
  });

  it("ramène un 29 février au 28", () => {
    expect(
      renouvellementCotisation({
        adhesion: "2020-01-01",
        aJour: true,
        factures: [
          { date: "2028-02-29", objet: "Cotisation annuelle", statut: "payee" },
        ],
      }),
    ).toBe("2029-02-28");
  });
});
