import { afterEach, describe, expect, it, vi } from "vitest";

// Hors requête : l'hôte d'une requête locale, quand aucune base n'est donnée.
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "localhost:3000" }),
}));
const { estAdresseLocale, urlPublique } = await import("@/lib/courriel");

afterEach(() => {
  vi.unstubAllEnvs();
});

const LIEN = "/auth/nouveau-mot-de-passe?jeton=abc";

describe("liens des e-mails", () => {
  it("prennent APP_URL en production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://app.cancham.mg/");
    expect(await urlPublique(LIEN)).toBe(`https://app.cancham.mg${LIEN}`);
  });

  it("n'envoient jamais vers localhost en production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const locale of [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://0.0.0.0:8080",
    ]) {
      vi.stubEnv("APP_URL", locale);
      expect(await urlPublique(LIEN)).toBe(`https://app.cancham.mg${LIEN}`);
    }
  });

  it("prennent app.cancham.mg quand APP_URL manque en production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "");
    expect(await urlPublique(LIEN)).toBe(`https://app.cancham.mg${LIEN}`);
  });

  it("restent sur la machine en local, où vivent les jetons de test", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_URL", "http://localhost:3000");
    expect(await urlPublique(LIEN)).toBe(`http://localhost:3000${LIEN}`);
  });

  it("reconnaissent une adresse locale, et elle seule", () => {
    expect(estAdresseLocale("http://localhost:3000")).toBe(true);
    expect(estAdresseLocale("http://[::1]:3000/")).toBe(true);
    expect(estAdresseLocale("https://app.cancham.mg")).toBe(false);
    expect(estAdresseLocale("https://localhost.cancham.mg")).toBe(false);
  });
});
