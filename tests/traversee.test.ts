import { describe, expect, it } from "vitest";
import {
  adresseInscription,
  basePlateforme,
  emailValide,
  PLATEFORME_PAR_DEFAUT,
  telephoneNormalise,
  verifierReservation,
} from "@/lib/traversee";

const complet = {
  nom: "Rakoto",
  prenom: "Marie Claire",
  entreprise: "Bio Sud & Fils",
  role: "Directrice générale",
  email: "marie@biosud.mg",
  telephone: "+261 34 12 345 67",
};

describe("réservation de La Traversée", () => {
  it("accepte un formulaire complet et nettoie le téléphone", () => {
    const v = verifierReservation(complet);
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.valeurs.telephone).toBe("+261341234567");
  });

  it("exige chaque champ", () => {
    const v = verifierReservation({});
    expect(v.ok).toBe(false);
    if (!v.ok) {
      expect(Object.keys(v.erreurs).sort()).toEqual(
        ["email", "entreprise", "nom", "prenom", "role", "telephone"].sort(),
      );
    }
  });

  it("refuse une adresse e-mail invalide", () => {
    for (const e of ["marie", "marie@", "marie@biosud", "ma rie@biosud.mg"]) {
      expect(emailValide(e)).toBe(false);
    }
    expect(emailValide("marie@biosud.mg")).toBe(true);
  });

  it("veut au moins 7 chiffres, accepte le + et les séparateurs", () => {
    expect(telephoneNormalise("123456")).toBeNull();
    expect(telephoneNormalise("1234567")).toBe("1234567");
    expect(telephoneNormalise("+1 (514) 555-0199")).toBe("+15145550199");
    expect(telephoneNormalise("034.12.345.67")).toBe("0341234567");
    expect(telephoneNormalise("+261 34 abc")).toBeNull();
    expect(telephoneNormalise("12+34567")).toBeNull();
    expect(telephoneNormalise("1234567890123456")).toBeNull();
  });

  it("construit l'adresse d'inscription avec des valeurs encodées", () => {
    const v = verifierReservation(complet);
    if (!v.ok) throw new Error("formulaire refusé");
    const adresse = adresseInscription(PLATEFORME_PAR_DEFAUT, v.valeurs);
    expect(
      adresse.startsWith(`${PLATEFORME_PAR_DEFAUT}/inscription?prenom=`),
    ).toBe(true);
    expect(adresse).toContain("prenom=Marie%20Claire");
    expect(adresse).toContain("entreprise=Bio%20Sud%20%26%20Fils");
    expect(adresse).toContain("telephone=%2B261341234567");
    expect(adresse.endsWith("&via=cancham")).toBe(true);
    const lu = new URL(adresse).searchParams;
    expect(lu.get("email")).toBe("marie@biosud.mg");
    expect(lu.get("role")).toBe("Directrice générale");
  });

  it("ne garde qu'une adresse de plateforme en https", () => {
    expect(basePlateforme(undefined)).toBe(PLATEFORME_PAR_DEFAUT);
    expect(basePlateforme("https://traversee.cancham.mg/")).toBe(
      "https://traversee.cancham.mg",
    );
    expect(basePlateforme("http://traversee.cancham.mg")).toBe(
      PLATEFORME_PAR_DEFAUT,
    );
    expect(basePlateforme("javascript:alert(1)")).toBe(PLATEFORME_PAR_DEFAUT);
    expect(basePlateforme("pas une adresse")).toBe(PLATEFORME_PAR_DEFAUT);
  });
});
