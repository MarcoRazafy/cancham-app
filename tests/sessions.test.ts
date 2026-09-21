import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Sessions et mots de passe : un cookie qu'on ne peut ni forger ni modifier,
 * et qui ne survit pas à un changement de mot de passe.
 */

// Le cookie déposé par `ouvrirSession`, capturé au lieu d'une vraie réponse.
const depose = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: (nom: string, valeur: string) => depose.set(nom, valeur),
    get: (nom: string) =>
      depose.has(nom) ? { value: depose.get(nom) } : undefined,
    delete: (nom: string) => depose.delete(nom),
  }),
}));

const {
  hacher,
  lireSession,
  NOM_COOKIE,
  ouvrirSession,
  sessionPerimee,
  verifier,
} = await import("@/lib/auth");

async function jetonPour(userId: string): Promise<string> {
  await ouvrirSession(userId);
  return depose.get(NOM_COOKIE)!;
}

beforeEach(() => depose.clear());
afterEach(() => vi.useRealTimers());

describe("mots de passe", () => {
  it("vérifie le bon et refuse les autres", () => {
    const empreinte = hacher("correct-cheval-pile");
    expect(empreinte).not.toContain("correct-cheval-pile");
    expect(verifier("correct-cheval-pile", empreinte)).toBe(true);
    expect(verifier("Correct-cheval-pile", empreinte)).toBe(false);
    expect(verifier("", empreinte)).toBe(false);
  });

  it("sale chaque empreinte : deux fois le même mot de passe, deux empreintes", () => {
    expect(hacher("identique")).not.toBe(hacher("identique"));
  });

  it("refuse un compte sans mot de passe ou une empreinte abîmée", () => {
    expect(verifier("nimporte", null)).toBe(false);
    expect(verifier("nimporte", "md5$abc$def")).toBe(false);
  });
});

describe("cookie de session", () => {
  it("se relit", async () => {
    const session = lireSession(await jetonPour("u1"));
    expect(session?.userId).toBe("u1");
  });

  it("refuse un identifiant modifié", async () => {
    const jeton = await jetonPour("u1");
    expect(lireSession(jeton.replace(/^u1\./, "admin."))).toBeNull();
  });

  it("refuse une signature fabriquée ou absente", async () => {
    const jeton = await jetonPour("u1");
    const charge = jeton.slice(0, jeton.lastIndexOf("."));
    expect(lireSession(`${charge}.fausse`)).toBeNull();
    expect(lireSession(charge)).toBeNull();
    expect(lireSession(undefined)).toBeNull();
    expect(lireSession("")).toBeNull();
  });

  it("expire au bout de trente jours", async () => {
    vi.useFakeTimers();
    const jeton = await jetonPour("u1");
    vi.advanceTimersByTime(29 * 86_400_000);
    expect(lireSession(jeton)).not.toBeNull();
    vi.advanceTimersByTime(2 * 86_400_000);
    expect(lireSession(jeton)).toBeNull();
  });

  it("ne survit pas à un changement de mot de passe", async () => {
    vi.useFakeTimers();
    const session = lireSession(await jetonPour("u1"))!;
    // Jamais changé : valable.
    expect(sessionPerimee(session, null)).toBe(false);
    // Changé une heure plus tard : la session d'avant est fermée.
    const plusTard = new Date(Date.now() + 3_600_000);
    expect(sessionPerimee(session, plusTard)).toBe(true);
    // La session ouverte juste après le changement, elle, reste valable.
    vi.setSystemTime(plusTard);
    const nouvelle = lireSession(await jetonPour("u1"))!;
    expect(sessionPerimee(nouvelle, plusTard)).toBe(false);
  });
});
