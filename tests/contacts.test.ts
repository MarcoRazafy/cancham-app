import { beforeEach, describe, expect, it, vi } from "vitest";

const comptes = new Map<string, { memberId: string | null; role: string }>();
let connecte: Record<string, unknown> = {};

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        comptes.get(where.id) ?? null,
    },
  },
}));
vi.mock("@/lib/flash", () => ({
  redirectWithErreur: (_chemin: string, message: string) => {
    throw new Error(message);
  },
}));
vi.mock("@/lib/session", () => ({
  getCurrentUser: async () => connecte,
  utilisateurConnecte: async () => connecte,
}));

const { exigerContact } = await import("@/lib/autorisations");

beforeEach(() => {
  comptes.clear();
  comptes.set("collegue", { memberId: "m1", role: "membre" });
  comptes.set("equipier", { memberId: "m1", role: "admin" });
});

describe("contacts d'une entreprise", () => {
  it("laissent un contact gérer ses collègues", async () => {
    connecte = { id: "moi", role: "membre", memberId: "m1" };
    await expect(exigerContact("collegue")).resolves.toMatchObject({
      memberId: "m1",
      estEquipe: false,
    });
  });

  it("ne livrent pas à ses collègues un compte d'équipe resté rattaché", async () => {
    connecte = { id: "moi", role: "membre", memberId: "m1" };
    await expect(exigerContact("equipier")).rejects.toThrow(
      "Contact introuvable.",
    );
  });

  it("ne laissent pas un manager modifier un compte d'équipe par la fiche", async () => {
    connecte = { id: "moi", role: "admin", niveauEquipe: "manager" };
    await expect(
      exigerContact("equipier", "/admin/membres/m1"),
    ).rejects.toThrow("Contact introuvable.");
    await expect(
      exigerContact("collegue", "/admin/membres/m1"),
    ).resolves.toMatchObject({ memberId: "m1", estEquipe: true });
  });

  it("restent fermés aux autres entreprises", async () => {
    connecte = { id: "moi", role: "membre", memberId: "m2" };
    await expect(exigerContact("collegue")).rejects.toThrow();
  });
});
