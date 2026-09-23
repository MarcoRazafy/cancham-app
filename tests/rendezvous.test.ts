import { describe, expect, it } from "vitest";
import {
  chevauche,
  creneauxLibres,
  finCreneau,
  joursOuverts,
  jourSemaine,
  versHeure,
} from "../lib/rendezvous";

/** Le 23 septembre 2026 est un mercredi ; le 26, un samedi. */
const MERCREDI = "2026-09-23";
const SAMEDI = "2026-09-26";

const MATIN = { jour: 3, debut: "09:00", fin: "12:00" };
const APRES_MIDI = { jour: 3, debut: "14:00", fin: "17:00" };

describe("jourSemaine", () => {
  it("compte le lundi pour 1 et le dimanche pour 7", () => {
    expect(jourSemaine("2026-09-21")).toBe(1);
    expect(jourSemaine(MERCREDI)).toBe(3);
    expect(jourSemaine("2026-09-27")).toBe(7);
  });
});

describe("versHeure et finCreneau", () => {
  it("écrit les heures sur deux chiffres", () => {
    expect(versHeure(0)).toBe("00:00");
    expect(versHeure(9 * 60 + 5)).toBe("09:05");
    expect(finCreneau("09:30", 45)).toBe("10:15");
  });
});

describe("chevauche", () => {
  it("laisse deux créneaux se toucher sans se recouvrir", () => {
    expect(
      chevauche(
        { debut: "09:00", fin: "09:30" },
        { debut: "09:30", fin: "10:00" },
      ),
    ).toBe(false);
    expect(
      chevauche(
        { debut: "09:00", fin: "09:45" },
        { debut: "09:30", fin: "10:00" },
      ),
    ).toBe(true);
  });
});

describe("creneauxLibres", () => {
  it("découpe une plage par la durée du rendez-vous", () => {
    expect(
      creneauxLibres({ jour: MERCREDI, plages: [MATIN], duree: 60 }),
    ).toEqual(["09:00", "10:00", "11:00"]);
  });

  it("n'offre pas un créneau qui déborderait de la plage", () => {
    // De 9 h à 12 h, en 45 minutes : le dernier commence à 11 h 15 et finirait
    // à midi ; un cinquième déborderait.
    expect(
      creneauxLibres({ jour: MERCREDI, plages: [MATIN], duree: 45 }),
    ).toEqual(["09:00", "09:45", "10:30", "11:15"]);
  });

  it("réunit les plages du jour et ignore celles des autres jours", () => {
    const plages = [
      MATIN,
      APRES_MIDI,
      { jour: 5, debut: "08:00", fin: "18:00" },
    ];
    expect(creneauxLibres({ jour: MERCREDI, plages, duree: 90 })).toEqual([
      "09:00",
      "10:30",
      "14:00",
      "15:30",
    ]);
  });

  it("retire les créneaux déjà pris, et ceux qu'un rendez-vous recouvre", () => {
    expect(
      creneauxLibres({
        jour: MERCREDI,
        plages: [MATIN],
        duree: 30,
        occupes: [{ debut: "09:30", fin: "10:30" }],
      }),
    ).toEqual(["09:00", "10:30", "11:00", "11:30"]);
  });

  it("ne propose rien un jour sans plage", () => {
    expect(
      creneauxLibres({ jour: SAMEDI, plages: [MATIN, APRES_MIDI], duree: 30 }),
    ).toEqual([]);
  });

  it("écarte les créneaux trop proches, et garde les suivants", () => {
    // Mercredi 8 h 00 à Madagascar : avec quatre heures de prévenance, rien
    // avant midi.
    const maintenant = Date.parse(`${MERCREDI}T08:00:00+03:00`);
    expect(
      creneauxLibres({
        jour: MERCREDI,
        plages: [MATIN, APRES_MIDI],
        duree: 60,
        maintenant,
      }),
    ).toEqual(["14:00", "15:00", "16:00"]);
  });

  it("ne propose rien pour une durée absurde", () => {
    expect(
      creneauxLibres({ jour: MERCREDI, plages: [MATIN], duree: 0 }),
    ).toEqual([]);
  });
});

describe("joursOuverts", () => {
  it("ne retient que les jours où l'équipe reçoit", () => {
    const jours = joursOuverts(MERCREDI, [MATIN]);
    expect(jours[0]).toBe(MERCREDI);
    expect(jours[1]).toBe("2026-09-30");
    expect(jours.every((j) => jourSemaine(j) === 3)).toBe(true);
  });

  it("ne rend rien quand aucune plage n'est déclarée", () => {
    expect(joursOuverts(MERCREDI, [])).toEqual([]);
  });
});
