import { afterEach, describe, expect, it, vi } from "vitest";

// Les présences importent la base ; ces tests n'en ont pas besoin.
vi.mock("@/lib/db", () => ({ prisma: {} }));
const { estTermine, finEvenement } = await import("@/lib/presences");

/**
 * Un événement se termine à son heure de fin, à Antananarivo — c'est ce qui
 * fait passer « absents » les inscrits qui ne sont pas venus.
 */

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("fin d'un événement", () => {
  it("tombe à l'heure de fin, heure de Madagascar", () => {
    expect(
      new Date(
        finEvenement({ date: "2026-09-22", fin: "20:00" }),
      ).toISOString(),
    ).toBe("2026-09-22T17:00:00.000Z");
  });

  it("court jusqu'au soir sans heure de fin", () => {
    expect(
      new Date(finEvenement({ date: "2026-09-22", fin: null })).toISOString(),
    ).toBe("2026-09-22T20:59:00.000Z");
  });

  it("accepte la date telle que la base la rend", () => {
    const depuisBase = new Date("2026-09-22T00:00:00.000Z");
    expect(finEvenement({ date: depuisBase, fin: "20:00" })).toBe(
      finEvenement({ date: "2026-09-22", fin: "20:00" }),
    );
  });

  it("n'est terminé qu'une fois l'heure passée", () => {
    vi.useFakeTimers();
    const e = { date: "2026-09-22", fin: "20:00" };
    vi.setSystemTime(new Date("2026-09-22T19:59:00+03:00"));
    expect(estTermine(e)).toBe(false);
    vi.setSystemTime(new Date("2026-09-22T20:00:00+03:00"));
    expect(estTermine(e)).toBe(true);
  });
});
