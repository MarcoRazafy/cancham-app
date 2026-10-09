import { describe, expect, it } from "vitest";
import {
  destinationDuRetour,
  RELAIS_RETOUR,
  REPLI_RETOUR,
  versRelais,
} from "@/lib/retour-paiement";

describe("adresse du relais", () => {
  it("porte la page voulue, protégée", () => {
    const url = versRelais("/membre/cotisations/retour?ref=CC-2026-ABC123");
    expect(url.startsWith(`${RELAIS_RETOUR}?vers=`)).toBe(true);
    const vers = new URL(url, "https://exemple.mg").searchParams.get("vers");
    expect(vers).toBe("/membre/cotisations/retour?ref=CC-2026-ABC123");
  });

  it("garde les paramètres d'un billet public", () => {
    const chemin = "/evenements/e1/billet?code=CC-E1-PUB-AAAA&ref=CC-2026-XYZ";
    const vers = new URL(
      versRelais(chemin),
      "https://exemple.mg",
    ).searchParams.get("vers");
    expect(destinationDuRetour(vers)).toBe(chemin);
  });
});

describe("destination du retour", () => {
  it("accepte les deux pages de retour", () => {
    for (const v of [
      "/membre/cotisations/retour?ref=CC-2026-ABC123",
      "/evenements/e1/billet?code=X&ref=Y",
    ]) {
      expect(destinationDuRetour(v)).toBe(v);
    }
  });

  it("se replie devant tout le reste", () => {
    for (const v of [
      null,
      undefined,
      "",
      "https://evil.example/",
      "//evil.example/membre/cotisations/retour?ref=x",
      "/\\evil.example",
      "/admin",
      "/membre/profil",
      "/membre/cotisations/retour",
      "/evenements/e1/../../admin/billet?x=1",
      "/evenements/e1/billet",
      "/membre/cotisations/retour?ref=x\nLocation: https://evil.example",
      "javascript:alert(1)",
      "/membre/cotisations/retour?ref=€",
      "/membre/cotisations/retour?ref=\0",
      "/evenements/../billet?x=1",
      "/evenements/%2e%2e/billet?x=1",
    ]) {
      expect(destinationDuRetour(v)).toBe(REPLI_RETOUR);
    }
  });
});
