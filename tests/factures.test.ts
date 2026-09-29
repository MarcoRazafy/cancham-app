import { describe, expect, it } from "vitest";
import { numeroSuivant } from "@/lib/factures";

/** Le numéro de facture qui suit : jamais un numéro déjà pris. */

describe("numéro de facture suivant", () => {
  it("commence à 0001 en début d'année", () => {
    expect(numeroSuivant([], "CC-2026-")).toBe("CC-2026-0001");
  });

  it("part du plus grand, même quand la suite a des trous", () => {
    expect(
      numeroSuivant(
        ["CC-2026-0001", "CC-2026-0005", "CC-2026-0003"],
        "CC-2026-",
      ),
    ).toBe("CC-2026-0006");
  });

  it("compare en nombre, pas en ordre alphabétique, au-delà de 9999", () => {
    // « CC-2026-10000 » se classe avant « CC-2026-9999 » en ordre
    // alphabétique : c'est ce qui redonnait 10000 à chaque inscription.
    expect(
      numeroSuivant(
        ["CC-2026-9998", "CC-2026-9999", "CC-2026-10000"],
        "CC-2026-",
      ),
    ).toBe("CC-2026-10001");
  });

  it("ignore un numéro dont la fin n'est pas un nombre", () => {
    expect(numeroSuivant(["CC-2026-0007", "CC-2026-ABC"], "CC-2026-")).toBe(
      "CC-2026-0008",
    );
  });
});
