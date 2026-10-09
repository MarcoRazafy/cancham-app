import { describe, expect, it } from "vitest";
import {
  extraitDePublication,
  LONGUEUR_PUBLICATION,
  publicationLongue,
  textePublication,
  titreDePublication,
} from "@/lib/publications";

describe("texte d'une publication", () => {
  it("retire les blancs autour et unifie les fins de ligne", () => {
    expect(textePublication("  \n\nBonjour\r\nle réseau  \n\n")).toBe(
      "Bonjour\nle réseau",
    );
  });

  it("ne garde jamais plus d'une ligne vide de suite", () => {
    expect(textePublication("Un\n\n\n\n\nDeux")).toBe("Un\n\nDeux");
  });

  it("borne la longueur", () => {
    const long = "a".repeat(LONGUEUR_PUBLICATION + 300);
    expect(textePublication(long)).toHaveLength(LONGUEUR_PUBLICATION);
  });

  it("reste rapide devant des dizaines de milliers d'espaces", () => {
    const hostile = `${" ".repeat(200_000)}x`;
    const debut = performance.now();
    textePublication(hostile);
    expect(performance.now() - debut).toBeLessThan(500);
  });

  it("retire les espaces de fin de ligne, pas ceux du milieu", () => {
    expect(textePublication("Un  mot   \nDeux\t\t\nTrois")).toBe(
      "Un  mot\nDeux\nTrois",
    );
  });

  it("garde un texte déjà enregistré plus long que la limite", () => {
    const ancien = "a".repeat(LONGUEUR_PUBLICATION + 4000);
    expect(textePublication(ancien, ancien.length)).toHaveLength(ancien.length);
  });

  it("rend une chaîne vide pour une saisie absente ou blanche", () => {
    expect(textePublication(null)).toBe("");
    expect(textePublication(undefined)).toBe("");
    expect(textePublication(" \n \t ")).toBe("");
  });
});

describe("titre tiré du texte", () => {
  it("prend la première ligne non vide", () => {
    expect(
      titreDePublication(
        "Nous ouvrons un bureau à Toamasina\nVenez nous voir.",
        "Bio Sud",
      ),
    ).toBe("Nous ouvrons un bureau à Toamasina");
  });

  it("raccourcit une longue ligne sans trancher un mot", () => {
    const ligne =
      "Nous sommes très heureux d’annoncer l’ouverture prochaine de notre nouveau bureau régional à Toamasina";
    const t = titreDePublication(ligne, "Bio Sud");
    expect(t.endsWith("…")).toBe(true);
    expect(Array.from(t).length).toBeLessThanOrEqual(91);
    expect(ligne.startsWith(t.slice(0, -1))).toBe(true);
    expect(ligne.charAt(t.length - 1)).toBe(" ");
  });

  it("porte le nom de l'entreprise quand il n'y a que des photos", () => {
    expect(titreDePublication("", "Bio Sud Essences")).toBe(
      "Publication de Bio Sud Essences",
    );
  });

  it("ne coupe pas un émoji en deux", () => {
    const t = titreDePublication("🎉".repeat(120), "Bio Sud");
    expect(t).toBe(`${"🎉".repeat(90)}…`);
  });

  it("tranche un mot interminable plutôt que de tout perdre", () => {
    const t = titreDePublication("x".repeat(300), "Bio Sud");
    expect(t).toBe(`${"x".repeat(90)}…`);
  });
});

describe("résumé tiré du texte", () => {
  it("garde un texte court tel quel, sur une ligne", () => {
    expect(extraitDePublication("Bonjour\n\nle réseau")).toBe(
      "Bonjour le réseau",
    );
  });

  it("ne tranche pas une adresse en fin de coupe", () => {
    const texte = `${"mot ".repeat(66)}https://exemple.mg/une/adresse/assez/longue suite`;
    const e = extraitDePublication(texte);
    expect(e.endsWith("…")).toBe(true);
    expect(e).not.toContain("https://");
  });

  it("est vide pour une publication sans texte", () => {
    expect(extraitDePublication("")).toBe("");
  });
});

describe("repli dans le fil", () => {
  it("laisse un texte court déplié", () => {
    expect(publicationLongue("Bonjour le réseau")).toBe(false);
  });

  it("replie un long paragraphe", () => {
    expect(publicationLongue("a".repeat(481))).toBe(true);
  });

  it("replie un texte de nombreuses lignes, même courtes", () => {
    expect(publicationLongue("a\nb\nc\nd\ne\nf\ng\nh")).toBe(true);
  });
});
