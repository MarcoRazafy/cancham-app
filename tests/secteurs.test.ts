import { describe, expect, it } from "vitest";
import { PROVISOIRE } from "@/lib/accueil";
import { SECTEURS, estSecteur, secteurOuProvisoire } from "@/lib/secteurs";

/** La liste fermée des secteurs : ce qui passe, ce qui ne passe pas. */

describe("secteurs d'activité", () => {
  it("compte les dix-huit secteurs de la chambre, sans doublon", () => {
    expect(SECTEURS).toHaveLength(18);
    expect(new Set(SECTEURS).size).toBe(18);
  });

  it("reconnaît un secteur de la liste, au caractère près", () => {
    expect(estSecteur("Agribusiness")).toBe(true);
    expect(estSecteur("BTP, immobilier et infrastructures")).toBe(true);
    expect(estSecteur("agribusiness")).toBe(false);
    expect(estSecteur("Agroalimentaire & export")).toBe(false);
  });

  it("met la valeur provisoire quand rien de valable n'est choisi", () => {
    expect(secteurOuProvisoire("Digital", PROVISOIRE.secteur)).toBe("Digital");
    expect(secteurOuProvisoire("", PROVISOIRE.secteur)).toBe(
      PROVISOIRE.secteur,
    );
    expect(secteurOuProvisoire("<script>", PROVISOIRE.secteur)).toBe(
      PROVISOIRE.secteur,
    );
  });

  it("n'a pas de secteur qui soit la valeur provisoire", () => {
    expect(estSecteur(PROVISOIRE.secteur)).toBe(false);
  });
});
