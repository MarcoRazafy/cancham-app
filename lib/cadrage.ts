export type Cadrage = { x: number; y: number };

export const CADRAGE_CENTRE: Cadrage = { x: 50, y: 50 };

export const PAS_CLAVIER = 2;

export function pourcentageDeCadrage(v: unknown): number {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim() || NaN);
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function cadrageValide(x: unknown, y: unknown): Cadrage {
  return { x: pourcentageDeCadrage(x), y: pourcentageDeCadrage(y) };
}

export function positionObjet(c: Cadrage | null | undefined): string {
  const { x, y } = c ?? CADRAGE_CENTRE;
  return `${x}% ${y}%`;
}

export function estCentre(c: Cadrage): boolean {
  return c.x === 50 && c.y === 50;
}

type Taille = { largeur: number; hauteur: number };

export function debordement(cadre: Taille, photo: Taille): Taille {
  if (
    cadre.largeur <= 0 ||
    cadre.hauteur <= 0 ||
    photo.largeur <= 0 ||
    photo.hauteur <= 0
  ) {
    return { largeur: 0, hauteur: 0 };
  }
  const parLargeur = cadre.largeur / photo.largeur;
  const parHauteur = cadre.hauteur / photo.hauteur;
  return parLargeur >= parHauteur
    ? {
        largeur: 0,
        hauteur: Math.max(0, photo.hauteur * parLargeur - cadre.hauteur),
      }
    : {
        largeur: Math.max(0, photo.largeur * parHauteur - cadre.largeur),
        hauteur: 0,
      };
}

export const DEBORD_MINIMAL = 1;

export function cadrageApresGlissement(
  depart: Cadrage,
  dx: number,
  dy: number,
  cadre: Taille,
  photo: Taille,
): Cadrage {
  const d = debordement(cadre, photo);
  const borne = (v: number) => Math.min(100, Math.max(0, v));
  return {
    x:
      d.largeur >= DEBORD_MINIMAL
        ? borne(depart.x - (dx / d.largeur) * 100)
        : depart.x,
    y:
      d.hauteur >= DEBORD_MINIMAL
        ? borne(depart.y - (dy / d.hauteur) * 100)
        : depart.y,
  };
}
