import { describe, expect, it } from "vitest";
import { numeroComplet, telephoneValide } from "@/lib/accueil";
import { echapper, gabarit } from "@/lib/courriel";
import { lienJournal } from "@/lib/journal";
import { normaliserSite } from "@/lib/liens";

/** Ce qu'un membre tape ne devient ni du code, ni un lien piégé. */

describe("sites web des fiches", () => {
  it("complète une adresse sans protocole", () => {
    expect(normaliserSite("biosudessences.mg")).toBe(
      "https://biosudessences.mg",
    );
    expect(normaliserSite("  http://www.exemple.mg/  ")).toBe(
      "http://www.exemple.mg",
    );
  });

  it("refuse tout ce qui n'est pas une adresse web", () => {
    expect(normaliserSite("javascript:alert(1)")).toBeNull();
    expect(normaliserSite("data:text/html,<script>")).toBeNull();
    expect(normaliserSite("monsite")).toBeNull();
    expect(normaliserSite("")).toBeNull();
  });
});

describe("e-mails", () => {
  it("échappe le HTML venu d'un formulaire", () => {
    expect(echapper(`<script>"x" & 'y'</script>`)).toBe(
      "&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;",
    );
    const { html, texte } = gabarit({
      titre: "Essai",
      paragraphes: ["Motivation : <img src=x onerror=alert(1)>"],
      bouton: { libelle: "Ouvrir", url: 'https://x.mg/?a="><script>' },
    });
    expect(html).not.toContain("<img");
    expect(html).not.toContain('"><script>');
    // La version texte garde la saisie telle quelle : elle n'est pas du HTML.
    expect(texte).toContain("<img src=x onerror=alert(1)>");
  });
});

describe("journal", () => {
  it("ne propose pas de lien vers ce qui a été supprimé", () => {
    expect(lienJournal("membre_supprime", "Member", "m1")).toBeNull();
    expect(lienJournal("paiement_enregistre", "Member", "m1")).toBe(
      "/admin/membres/m1",
    );
  });
});

describe("téléphone à l'inscription", () => {
  it("accepte les numéros de Madagascar et du Canada, écrits librement", () => {
    expect(telephoneValide("+261 34 50 280 53")).toBe(true);
    expect(telephoneValide("034 50 280 53")).toBe(true);
    expect(telephoneValide("+1 (514) 555-0199")).toBe(true);
  });

  it("refuse ce qui n'est pas un numéro", () => {
    expect(telephoneValide("appelez-moi")).toBe(false);
    expect(telephoneValide("12 34")).toBe(false);
    expect(telephoneValide("<script>")).toBe(false);
  });
});

describe("numéro avec indicatif", () => {
  it("ajoute l'indicatif et retire le 0 du numéro national", () => {
    expect(numeroComplet("+261", "034 50 280 53")).toBe("+261 34 50 280 53");
    expect(numeroComplet("+1", "514 555 0199")).toBe("+1 514 555 0199");
  });

  it("garde tel quel un numéro déjà international, ou sans indicatif choisi", () => {
    expect(numeroComplet("+261", "+33 6 12 34 56 78")).toBe(
      "+33 6 12 34 56 78",
    );
    expect(numeroComplet("", "+230 5 123 4567")).toBe("+230 5 123 4567");
  });

  it("ne fabrique rien à partir d'un champ vide", () => {
    expect(numeroComplet("+261", "   ")).toBe("");
  });
});
