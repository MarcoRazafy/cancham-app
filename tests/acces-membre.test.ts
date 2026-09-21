import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isAccessLocked,
  isOverdueWarning,
  joursDeRetard,
  lockReason,
  RETARD_BLOCAGE_JOURS,
} from "@/lib/membership";
import type { Member, MemberStatus } from "@/lib/types";

/**
 * Le cœur du produit : l'accès dépend de la cotisation. Un membre en retard
 * est prévenu pendant trente jours, puis restreint à son profil.
 */

const membre = (statut: MemberStatus, retardDepuis: string | null = null) =>
  ({ id: "m", nom: "Essai", statut, retardDepuis }) as Member;

beforeEach(() => vi.stubEnv("CANCHAM_TODAY", "2026-09-21"));
afterEach(() => vi.unstubAllEnvs());

describe("accès selon la cotisation", () => {
  it("ouvre tout à un membre à jour", () => {
    const m = membre("a_jour");
    expect(isAccessLocked(m)).toBe(false);
    expect(lockReason(m)).toBeNull();
    expect(isOverdueWarning(m)).toBe(false);
  });

  it("restreint une candidature et une adhésion en attente de paiement", () => {
    for (const statut of ["candidature", "en_attente"] as const) {
      expect(isAccessLocked(membre(statut))).toBe(true);
      expect(lockReason(membre(statut))).toBe("adhesion_en_attente");
    }
  });

  it("prévient sans couper pendant le délai de grâce", () => {
    const m = membre("en_retard", "2026-09-01");
    expect(joursDeRetard(m)).toBe(20);
    expect(isAccessLocked(m)).toBe(false);
    expect(isOverdueWarning(m)).toBe(true);
  });

  it("coupe au-delà du délai, pas le jour même", () => {
    // Pile au seuil : encore ouvert.
    const auSeuil = membre("en_retard", "2026-08-22");
    expect(joursDeRetard(auSeuil)).toBe(RETARD_BLOCAGE_JOURS);
    expect(isAccessLocked(auSeuil)).toBe(false);

    // Un jour de plus : restreint.
    const auDela = membre("en_retard", "2026-08-21");
    expect(joursDeRetard(auDela)).toBe(RETARD_BLOCAGE_JOURS + 1);
    expect(isAccessLocked(auDela)).toBe(true);
    expect(lockReason(auDela)).toBe("retard_bloquant");
  });

  it("ne compte aucun retard sans date de bascule", () => {
    expect(joursDeRetard(membre("a_jour"))).toBe(0);
    expect(joursDeRetard(null)).toBe(0);
    expect(isAccessLocked(null)).toBe(false);
  });
});
