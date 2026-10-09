import { describe, expect, it } from "vitest";
import { abonnementValide, apercu } from "@/lib/push";

const abonnement = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc-DEF_123",
  keys: {
    p256dh:
      "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
    auth: "tBHItJI5svbpez7KI4CCXg",
  },
};

describe("abonnement reçu", () => {
  it("accepte ce que donne PushSubscription.toJSON()", () => {
    expect(abonnementValide(abonnement)).toBe(true);
  });

  it("refuse une adresse qui n'est pas en https, ou des clés absentes", () => {
    expect(
      abonnementValide({ ...abonnement, endpoint: "http://x.example/1" }),
    ).toBe(false);
    expect(abonnementValide({ endpoint: abonnement.endpoint })).toBe(false);
    expect(
      abonnementValide({ ...abonnement, keys: { p256dh: "court", auth: "" } }),
    ).toBe(false);
    expect(abonnementValide(null)).toBe(false);
    expect(abonnementValide("https://x.example")).toBe(false);
  });
});

describe("aperçu d'un message", () => {
  it("garde la première ligne, coupée proprement", () => {
    expect(apercu("Bonjour,\nvoici le dossier.")).toBe("Bonjour,");
    const coupe = apercu("  a ".repeat(80), 20);
    expect(coupe.length).toBeLessThanOrEqual(20);
    expect(coupe.endsWith("…")).toBe(true);
    expect(coupe).not.toMatch(/\s…$/);
    expect(apercu("x".repeat(30), 20)).toBe(`${"x".repeat(19)}…`);
    expect(apercu("court")).toBe("court");
  });
});
