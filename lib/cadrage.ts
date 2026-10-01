/**
 * Cadrage d'une photo de couverture.
 *
 * Une couverture est toujours rognée : son cadre est un bandeau, la photo
 * rarement. Le cadrage dit quel point de la photo reste visible — deux
 * pourcentages, ceux de la propriété CSS `object-position`. Le même cadrage
 * vaut pour tous les cadres, de la carte de l'annuaire au bandeau de la
 * fiche : chacun rogne à sa façon, autour du même point.
 *
 * Sans `server-only` : le navigateur s'en sert pendant qu'on fait glisser la
 * photo, le serveur pour contrôler ce qu'il enregistre.
 */
export type Cadrage = { x: number; y: number };

/** Une photo centrée, comme elles l'étaient toutes avant qu'on les déplace. */
export const CADRAGE_CENTRE: Cadrage = { x: 50, y: 50 };

/** Pas d'un appui sur une flèche du clavier, en points de pourcentage. */
export const PAS_CLAVIER = 2;

/** Un pourcentage entier, entre 0 et 100 ; le centre pour une valeur illisible. */
export function pourcentageDeCadrage(v: unknown): number {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim() || NaN);
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Le cadrage tel qu'on l'enregistre : deux entiers bornés. */
export function cadrageValide(x: unknown, y: unknown): Cadrage {
  return { x: pourcentageDeCadrage(x), y: pourcentageDeCadrage(y) };
}

/** La valeur de `object-position` qui applique ce cadrage. */
export function positionObjet(c: Cadrage | null | undefined): string {
  const { x, y } = c ?? CADRAGE_CENTRE;
  return `${x}% ${y}%`;
}

export function estCentre(c: Cadrage): boolean {
  return c.x === 50 && c.y === 50;
}

type Taille = { largeur: number; hauteur: number };

/**
 * Ce que la photo dépasse du cadre, en pixels, une fois agrandie pour le
 * couvrir (`object-fit: cover`). Elle ne dépasse que dans un sens : l'autre
 * tombe juste.
 */
export function debordement(cadre: Taille, photo: Taille): Taille {
  if (
    cadre.largeur <= 0 ||
    cadre.hauteur <= 0 ||
    photo.largeur <= 0 ||
    photo.hauteur <= 0
  ) {
    return { largeur: 0, hauteur: 0 };
  }
  // Le sens qui tombe juste vaut zéro par construction, sans soustraction :
  // `1600 * (872 / 1600) - 872` laisse un résidu de 1e-13, qu'on prendrait
  // pour un débordement — et un pixel de dérive y vaudrait des milliards de
  // points de pourcentage.
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

/**
 * Sous un pixel de débordement, il n'y a rien à faire glisser : des
 * proportions presque égales donneraient des centaines de points par pixel.
 */
export const DEBORD_MINIMAL = 1;

/**
 * Le cadrage après avoir fait glisser la photo de `dx`, `dy` pixels.
 *
 * Tirer la photo vers le bas découvre son haut : le pourcentage baisse. Dans
 * le sens où la photo ne dépasse pas, il n'y a rien à faire glisser, et le
 * cadrage ne bouge pas. Le résultat n'est pas arrondi : le geste reste
 * fluide, et l'arrondi se fait à l'enregistrement.
 */
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
