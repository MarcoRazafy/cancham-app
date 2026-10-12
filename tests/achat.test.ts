import { describe, expect, it } from "vitest";
import {
  achatDe,
  detailAchat,
  estTypeAchat,
  objetAchat,
  pageAchat,
} from "@/lib/achat";

describe("achat d’une ressource ou d’un service", () => {
  it("se relit depuis le détail d’un règlement", () => {
    const detail = detailAchat(
      { type: "ressource", id: "r1", titre: "Guide export" },
      "u1",
    );
    expect(achatDe(detail)).toEqual({
      type: "ressource",
      id: "r1",
      titre: "Guide export",
      par: "u1",
    });
  });

  it("survit à l’ajout du titulaire de la carte", () => {
    const detail = {
      ...detailAchat({ type: "service", id: "s1", titre: "Étude" }, "u1"),
      titulaire: "Marie Rakoto",
    };
    expect(achatDe(detail)?.id).toBe("s1");
  });

  it("ne voit pas d’achat dans les autres règlements", () => {
    for (const d of [
      null,
      undefined,
      "ressource",
      [],
      {},
      { titulaire: "Marie Rakoto" },
      { inscription: "CC-E1-AAAA", eventId: "e1" },
      { achat: "cotisation", cible: "x" },
      { achat: "ressource" },
      { achat: "ressource", cible: "" },
      { achat: "ressource", cible: 12 },
    ]) {
      expect(achatDe(d)).toBeNull();
    }
  });

  it("n’accepte que les deux types connus", () => {
    expect(estTypeAchat("ressource")).toBe(true);
    expect(estTypeAchat("service")).toBe(true);
    expect(estTypeAchat("cotisation")).toBe(false);
    expect(estTypeAchat("")).toBe(false);
  });

  it("nomme la facture et ramène à la bonne page", () => {
    expect(objetAchat({ type: "ressource", titre: "Guide export" })).toBe(
      "Ressource — Guide export",
    );
    expect(objetAchat({ type: "service", titre: "Étude de marché" })).toBe(
      "Service — Étude de marché",
    );
    expect(pageAchat({ type: "ressource", id: "r1" })).toBe(
      "/membre/ressources/r1",
    );
    expect(pageAchat({ type: "service", id: "s1" })).toBe(
      "/membre/offres-cancham",
    );
  });
});
