import { describe, expect, it } from "vitest";
import {
  CADRAGE_CENTRE,
  cadrageApresGlissement,
  cadrageValide,
  debordement,
  estCentre,
  positionObjet,
  pourcentageDeCadrage,
} from "@/lib/cadrage";

describe("pourcentage de cadrage", () => {
  it("garde un entier entre 0 et 100", () => {
    expect(pourcentageDeCadrage(0)).toBe(0);
    expect(pourcentageDeCadrage(100)).toBe(100);
    expect(pourcentageDeCadrage("37")).toBe(37);
    expect(pourcentageDeCadrage(37.6)).toBe(38);
  });

  it("borne ce qui sort du cadre", () => {
    expect(pourcentageDeCadrage(-20)).toBe(0);
    expect(pourcentageDeCadrage(250)).toBe(100);
    expect(pourcentageDeCadrage("1e9")).toBe(100);
  });

  it("revient au centre devant une valeur illisible", () => {
    for (const v of ["", "  ", "abc", null, undefined, NaN, Infinity, {}]) {
      expect(pourcentageDeCadrage(v)).toBe(50);
    }
  });

  it("valide les deux axes ensemble", () => {
    expect(cadrageValide("12", "-3")).toEqual({ x: 12, y: 0 });
    expect(cadrageValide(undefined, "80.4")).toEqual({ x: 50, y: 80 });
  });
});

describe("position de l'objet", () => {
  it("écrit la valeur CSS", () => {
    expect(positionObjet({ x: 30, y: 75 })).toBe("30% 75%");
  });

  it("centre sans cadrage", () => {
    expect(positionObjet(null)).toBe("50% 50%");
    expect(positionObjet(undefined)).toBe("50% 50%");
    expect(estCentre(CADRAGE_CENTRE)).toBe(true);
    expect(estCentre({ x: 50, y: 49 })).toBe(false);
  });
});

describe("débordement de la photo", () => {
  const bandeau = { largeur: 900, hauteur: 260 };

  it("ne dépasse qu'en hauteur pour une photo moins allongée que le cadre", () => {
    const d = debordement(bandeau, { largeur: 1600, hauteur: 900 });
    expect(d.largeur).toBe(0);
    expect(d.hauteur).toBeCloseTo(246.25);
  });

  it("ne dépasse qu'en largeur pour une photo plus allongée que le cadre", () => {
    const d = debordement(bandeau, { largeur: 2600, hauteur: 260 });
    expect(d.hauteur).toBe(0);
    expect(d.largeur).toBeCloseTo(1700);
  });

  it("ne dépasse pas quand les proportions sont les mêmes", () => {
    expect(debordement(bandeau, { largeur: 1800, hauteur: 520 })).toEqual({
      largeur: 0,
      hauteur: 0,
    });
  });

  it("ne divise pas par zéro tant que la photo n'est pas chargée", () => {
    expect(debordement(bandeau, { largeur: 0, hauteur: 0 })).toEqual({
      largeur: 0,
      hauteur: 0,
    });
    expect(debordement({ largeur: 0, hauteur: 0 }, bandeau)).toEqual({
      largeur: 0,
      hauteur: 0,
    });
  });
});

describe("résidu d'arrondi", () => {
  const cadre = { largeur: 872, hauteur: 260 };
  const photo = { largeur: 1600, hauteur: 1067 };

  it("le sens qui tombe juste vaut exactement zéro", () => {
    expect(debordement(cadre, photo).largeur).toBe(0);
  });

  it("un pixel de dérive latérale ne déplace rien", () => {
    const c = cadrageApresGlissement(CADRAGE_CENTRE, 1, 30, cadre, photo);
    expect(c.x).toBe(50);
    expect(c.y).toBeLessThan(50);
  });

  it("moins d'un pixel de débordement ne se fait pas glisser", () => {
    const presque = { largeur: 1000, hauteur: 298.5 };
    const c = cadrageApresGlissement(CADRAGE_CENTRE, 0, 1, cadre, presque);
    expect(c).toEqual(CADRAGE_CENTRE);
  });
});

describe("glissement de la photo", () => {
  const cadre = { largeur: 900, hauteur: 260 };
  const haute = { largeur: 1600, hauteur: 900 };

  it("tirer vers le bas découvre le haut de la photo", () => {
    const c = cadrageApresGlissement(CADRAGE_CENTRE, 0, 61.5625, cadre, haute);
    expect(c.x).toBe(50);
    expect(c.y).toBeCloseTo(25);
  });

  it("tirer vers le haut découvre le bas de la photo", () => {
    const c = cadrageApresGlissement(CADRAGE_CENTRE, 0, -61.5625, cadre, haute);
    expect(c.y).toBeCloseTo(75);
  });

  it("s'arrête aux bords de la photo", () => {
    expect(
      cadrageApresGlissement(CADRAGE_CENTRE, 0, 5000, cadre, haute).y,
    ).toBe(0);
    expect(
      cadrageApresGlissement(CADRAGE_CENTRE, 0, -5000, cadre, haute).y,
    ).toBe(100);
  });

  it("ignore le sens où la photo ne dépasse pas", () => {
    const c = cadrageApresGlissement({ x: 20, y: 40 }, 300, 0, cadre, haute);
    expect(c).toEqual({ x: 20, y: 40 });
  });

  it("glisse en largeur pour une photo panoramique", () => {
    const large = { largeur: 2600, hauteur: 260 };
    const c = cadrageApresGlissement(CADRAGE_CENTRE, -425, 90, cadre, large);
    expect(c.x).toBeCloseTo(75);
    expect(c.y).toBe(50);
  });

  it("aller puis retour ramène au point de départ", () => {
    const depart = { x: 33, y: 60 };
    const aller = cadrageApresGlissement(depart, 0, 40, cadre, haute);
    const retour = cadrageApresGlissement(aller, 0, -40, cadre, haute);
    expect(retour.y).toBeCloseTo(60);
  });
});
