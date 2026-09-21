import { afterEach, describe, expect, it, vi } from "vitest";
import { minutes, oublier, tentative } from "@/lib/limite";

/** Les essais de mots de passe en série finissent par attendre. */

const QUART_HEURE = 15 * 60 * 1000;

afterEach(() => vi.useRealTimers());

describe("limitation des tentatives", () => {
  it("laisse passer jusqu'au plafond, puis fait attendre", () => {
    for (let i = 0; i < 8; i++) {
      expect(tentative("essai:plafond", 8, QUART_HEURE)).toBe(0);
    }
    const attente = tentative("essai:plafond", 8, QUART_HEURE);
    expect(attente).toBeGreaterThan(0);
    expect(minutes(attente)).toBe(15);
  });

  it("repart à zéro après une réussite", () => {
    for (let i = 0; i < 9; i++) tentative("essai:reussite", 8, QUART_HEURE);
    oublier("essai:reussite");
    expect(tentative("essai:reussite", 8, QUART_HEURE)).toBe(0);
  });

  it("oublie les essais sortis de la fenêtre", () => {
    vi.useFakeTimers();
    for (let i = 0; i < 9; i++) tentative("essai:fenetre", 8, QUART_HEURE);
    vi.advanceTimersByTime(QUART_HEURE + 1000);
    expect(tentative("essai:fenetre", 8, QUART_HEURE)).toBe(0);
  });

  it("compte chaque clé à part", () => {
    for (let i = 0; i < 9; i++) tentative("essai:a", 8, QUART_HEURE);
    expect(tentative("essai:b", 8, QUART_HEURE)).toBe(0);
  });
});
