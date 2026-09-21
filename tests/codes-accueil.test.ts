import { describe, expect, it } from "vitest";
import { codeRepresentant, extraireCode } from "@/lib/codes-accueil";

/** Chaque représentant a son QR code ; le scanner doit retrouver le bon. */

describe("codes d'accueil", () => {
  it("donne au premier représentant le code de l'inscription, aux suivants leur rang", () => {
    expect(codeRepresentant("CC-VOPA-K7Q2PX", 0)).toBe("CC-VOPA-K7Q2PX");
    expect(codeRepresentant("CC-VOPA-K7Q2PX", 1)).toBe("CC-VOPA-K7Q2PX-2");
    expect(codeRepresentant("CC-VOPA-K7Q2PX", 9)).toBe("CC-VOPA-K7Q2PX-10");
  });

  it("lit le rang d'un représentant sans le couper", () => {
    expect(extraireCode("CC-VOPA-K7Q2PX-2")).toBe("CC-VOPA-K7Q2PX-2");
    expect(extraireCode("CC-VOPA-K7Q2PX-10")).toBe("CC-VOPA-K7Q2PX-10");
  });

  it("lit toujours les anciens codes, même au milieu d'un texte", () => {
    expect(extraireCode("CC-E2-4718")).toBe("CC-E2-4718");
    expect(extraireCode("Billet : cc-e2-4718 · merci")).toBe("CC-E2-4718");
    expect(extraireCode("https://x.mg/?c=CC-VOPA-K7Q2PX-3&r=1")).toBe(
      "CC-VOPA-K7Q2PX-3",
    );
  });

  it("rend la saisie telle quelle quand rien ne ressemble à un code", () => {
    expect(extraireCode("  inconnu ")).toBe("inconnu");
  });
});
