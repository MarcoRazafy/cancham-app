import { describe, expect, it } from "vitest";
import {
  cheminRendezvous,
  estCheminFerme,
  estLienInterne,
  normaliserLien,
  typeDuLienRendezvous,
} from "@/lib/liens";

const ICI = ["https://app.cancham.mg", "http://localhost:3000/"];

describe("lien d'un rendez-vous", () => {
  it("mène à la réservation du type", () => {
    expect(cheminRendezvous("abc123")).toBe("/membre/rendez-vous?type=abc123");
  });

  it("protège un identifiant inattendu", () => {
    expect(cheminRendezvous("a&b=c")).toBe(
      "/membre/rendez-vous?type=a%26b%3Dc",
    );
  });
});

describe("lien d'un service", () => {
  it("garde un chemin de la plateforme tel quel", () => {
    expect(normaliserLien("/membre/rendez-vous?type=abc", ICI)).toBe(
      "/membre/rendez-vous?type=abc",
    );
  });

  it("range en chemin une adresse de la plateforme", () => {
    expect(
      normaliserLien("https://app.cancham.mg/membre/rendez-vous?type=abc", ICI),
    ).toBe("/membre/rendez-vous?type=abc");
    expect(
      normaliserLien("http://localhost:3000/membre/rendez-vous?type=abc", ICI),
    ).toBe("/membre/rendez-vous?type=abc");
  });

  it("garde entière l'adresse d'un autre site", () => {
    expect(normaliserLien("https://calendly.com/cancham/30min", ICI)).toBe(
      "https://calendly.com/cancham/30min",
    );
    expect(normaliserLien("exemple.mg/page", ICI)).toBe(
      "https://exemple.mg/page",
    );
  });

  it("refuse ce qui n'est pas une adresse web", () => {
    for (const v of [
      "javascript:alert(1)",
      "data:text/html,<script>1</script>",
      "//evil.example/chemin",
      "/\\evil.example",
      "un lien",
      "monsite",
      "",
      "   ",
    ]) {
      expect(normaliserLien(v, ICI)).toBeNull();
    }
  });

  it("ne prend pas un autre site pour la plateforme", () => {
    expect(
      normaliserLien("https://app.cancham.mg.evil.example/membre", ICI),
    ).toBe("https://app.cancham.mg.evil.example/membre");
  });

  it("ne fabrique pas un chemin qui mènerait ailleurs", () => {
    for (const v of [
      "https://app.cancham.mg//evil.example/x",
      "/.//evil.example/x",
      "/x/..//evil.example",
    ]) {
      expect(normaliserLien(v, ICI)).toBeNull();
    }
  });

  it("refuse une adresse qui porte des identifiants", () => {
    for (const v of [
      "https://app.cancham.mg@evil.example/x",
      "equipe@app.cancham.mg",
      "mailto:equipe@app.cancham.mg",
      "contact@exemple.mg",
      "javascript:alert(1)@evil.example",
    ]) {
      expect(normaliserLien(v, ICI)).toBeNull();
    }
  });

  it("reconnaît le lien d'un rendez-vous", () => {
    expect(typeDuLienRendezvous("/membre/rendez-vous?type=abc")).toBe("abc");
    expect(typeDuLienRendezvous("/membre/rendez-vous")).toBeNull();
    expect(typeDuLienRendezvous("/membre/annuaire?type=abc")).toBeNull();
    expect(typeDuLienRendezvous("https://exemple.mg/?type=abc")).toBeNull();
  });

  it("repère un chemin fermé aux membres", () => {
    for (const v of [
      "/admin",
      "/admin/rendez-vous",
      "/auth?suite=/x",
      "/api/sante",
    ]) {
      expect(estCheminFerme(v)).toBe(true);
    }
    for (const v of [
      "/membre/rendez-vous?type=abc",
      "/administration",
      "/evenements/e1",
    ]) {
      expect(estCheminFerme(v)).toBe(false);
    }
  });

  it("distingue un chemin d'une adresse", () => {
    expect(estLienInterne("/membre/rendez-vous")).toBe(true);
    expect(estLienInterne("//evil.example")).toBe(false);
    expect(estLienInterne("https://exemple.mg")).toBe(false);
  });
});
