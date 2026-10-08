import {
  lienSur,
  type Alignement,
  type Ligne,
  type Passage,
  type Taille,
} from "@/lib/blocs";

/**
 * Le passage entre le texte mis en forme tel qu'on l'enregistre (des lignes,
 * des passages et leurs marques — voir `lib/blocs.ts`) et la zone de saisie
 * du navigateur.
 *
 * Dans les deux sens, on ne manipule que des nœuds : jamais de HTML écrit en
 * chaîne. Ce que le navigateur a fabriqué pendant la saisie — `<b>`,
 * `<font color>`, `<span style>`, selon son humeur — est relu marque par
 * marque, et tout ce qu'on ne connaît pas redevient du texte simple.
 */

/** Les tailles, telles que la commande `fontSize` du navigateur les numérote. */
export const TAILLE_NAVIGATEUR: Record<Taille | "", string> = {
  petit: "2",
  "": "3",
  grand: "5",
  "tres-grand": "6",
};

const BLOCS = new Set([
  "P",
  "DIV",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BLOCKQUOTE",
  "PRE",
  "UL",
  "OL",
  "LI",
]);

/** `rgb(173, 7, 7)` ou `#ad0707` → `#ad0707`. `null` pour le reste. */
export function enHex(couleur: string): string | null {
  const c = couleur.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(c)) return c;
  if (/^#[0-9a-f]{3}$/.test(c)) {
    return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
  }
  const m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(c);
  if (!m) return null;
  return `#${[m[1], m[2], m[3]]
    .map((v) => Math.min(255, Number(v)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function tailleDe(el: HTMLElement): Taille | "" | undefined {
  const posee = el.dataset.taille;
  if (posee === "petit" || posee === "grand" || posee === "tres-grand") {
    return posee;
  }
  if (el.tagName === "FONT" && el.hasAttribute("size")) {
    const n = Number(el.getAttribute("size"));
    return n <= 2 ? "petit" : n === 3 ? "" : n <= 5 ? "grand" : "tres-grand";
  }
  const css = el.style.fontSize;
  if (!css) return undefined;
  if (/^(xx-small|x-small|small|smaller)$/.test(css)) return "petit";
  if (css === "medium") return "";
  if (/^(large|x-large|larger)$/.test(css)) return "grand";
  if (/^(xx-large|xxx-large)$/.test(css)) return "tres-grand";
  return undefined;
}

/** Relit un nœud et ce qu'il contient, avec les marques héritées. */
function relire(
  noeud: Node,
  marques: Omit<Passage, "t">,
  base: string | null,
  sortie: Passage[],
) {
  if (noeud.nodeType === Node.TEXT_NODE) {
    // L'espace sans chasse que certains navigateurs posent pour tenir le curseur.
    const t = (noeud.nodeValue ?? "").replace(/\u200b/g, "");
    if (t) sortie.push({ t, ...marques });
    return;
  }
  if (!(noeud instanceof HTMLElement)) return;
  if (noeud.tagName === "BR") {
    sortie.push({ t: "\n", ...marques });
    return;
  }

  const m = { ...marques };
  const { tagName: balise, style } = noeud;
  if (balise === "B" || balise === "STRONG") m.g = true;
  if (balise === "I" || balise === "EM") m.i = true;
  if (balise === "U") m.s = true;
  if (balise === "A") {
    const lien = lienSur(noeud.getAttribute("href") ?? "");
    if (lien) m.lien = lien;
  }

  if (style.fontWeight) {
    const gras = style.fontWeight === "bold" || Number(style.fontWeight) >= 600;
    if (gras) m.g = true;
    else delete m.g;
  }
  if (style.fontStyle === "italic") m.i = true;
  if (style.fontStyle === "normal") delete m.i;
  if (
    `${style.textDecorationLine} ${style.textDecoration}`.includes("underline")
  ) {
    m.s = true;
  }

  const couleur = enHex(
    style.color ||
      (balise === "FONT" ? (noeud.getAttribute("color") ?? "") : ""),
  );
  if (couleur) {
    // La couleur du texte courant n'est pas une couleur choisie.
    if (couleur === base) delete m.couleur;
    else m.couleur = couleur;
  }

  const taille = tailleDe(noeud);
  if (taille === "") delete m.taille;
  else if (taille) m.taille = taille;

  noeud.childNodes.forEach((enfant) => relire(enfant, m, base, sortie));
}

function passagesDe(el: Node, base: string | null): Passage[] {
  const sortie: Passage[] = [];
  el.childNodes.forEach((enfant) => relire(enfant, {}, base, sortie));
  // Le `<br>` que le navigateur pose au bout d'un paragraphe pour le tenir
  // ouvert n'est pas un retour à la ligne.
  const dernier = sortie[sortie.length - 1];
  if (dernier?.t === "\n") sortie.pop();
  else if (dernier?.t.endsWith("\n")) dernier.t = dernier.t.slice(0, -1);
  return sortie;
}

function alignementDe(el: HTMLElement): Alignement | undefined {
  const a = el.style.textAlign || el.getAttribute("align") || "";
  return a === "center" ? "centre" : a === "right" ? "droite" : undefined;
}

const estBloc = (n: Node): n is HTMLElement =>
  n instanceof HTMLElement && BLOCS.has(n.tagName);

/** Les lignes d'un conteneur : ses paragraphes et ses listes, dans l'ordre. */
function lignesDe(
  conteneur: HTMLElement,
  base: string | null,
  herite?: Alignement,
): Ligne[] {
  const lignes: Ligne[] = [];
  // Du texte posé à même le conteneur, hors de tout paragraphe.
  let libre: Node[] = [];
  const vider = () => {
    if (!libre.length) return;
    const faux = document.createElement("p");
    libre.forEach((n) => faux.appendChild(n.cloneNode(true)));
    const passages = passagesDe(faux, base);
    if (passages.some((p) => p.t.trim())) {
      lignes.push({
        genre: "p",
        passages,
        ...(herite ? { alignement: herite } : {}),
      });
    }
    libre = [];
  };

  conteneur.childNodes.forEach((n) => {
    if (!estBloc(n)) {
      libre.push(n);
      return;
    }
    vider();
    if (n.tagName === "UL" || n.tagName === "OL") {
      const items = Array.from(n.children)
        .filter((li) => li.tagName === "LI")
        .map((li) => passagesDe(li, base));
      lignes.push({ genre: n.tagName === "UL" ? "ul" : "ol", items });
      return;
    }
    const alignement = alignementDe(n) ?? herite;
    // Un bloc qui en contient d'autres n'est qu'une enveloppe.
    if (Array.from(n.childNodes).some(estBloc)) {
      lignes.push(...lignesDe(n, base, alignement));
      return;
    }
    lignes.push({
      genre: "p",
      passages: passagesDe(n, base),
      ...(alignement ? { alignement } : {}),
    });
  });
  vider();
  return lignes;
}

/** Relit la zone de saisie : ce qu'elle contient, en lignes à enregistrer. */
export function lignesDepuis(racine: HTMLElement): Ligne[] {
  return lignesDe(racine, enHex(getComputedStyle(racine).color));
}

function poserPassages(parent: HTMLElement, passages: Passage[]) {
  for (const p of passages) {
    let hote: HTMLElement = parent;
    const envelopper = (el: HTMLElement) => {
      hote.appendChild(el);
      hote = el;
    };
    if (p.lien) {
      const a = document.createElement("a");
      a.setAttribute("href", p.lien);
      envelopper(a);
    }
    if (p.couleur || p.taille) {
      const span = document.createElement("span");
      if (p.couleur) span.style.color = p.couleur;
      if (p.taille) span.dataset.taille = p.taille;
      envelopper(span);
    }
    if (p.g) envelopper(document.createElement("b"));
    if (p.i) envelopper(document.createElement("i"));
    if (p.s) envelopper(document.createElement("u"));
    p.t.split("\n").forEach((morceau, i) => {
      if (i) hote.appendChild(document.createElement("br"));
      if (morceau) hote.appendChild(document.createTextNode(morceau));
    });
  }
}

/**
 * Dessine des lignes enregistrées dans la zone de saisie.
 *
 * Un paragraphe y est un `<div>`, pas un `<p>` : c'est ce que le navigateur
 * fabrique de lui-même à chaque retour à la ligne, et le seul qu'il sache
 * changer proprement en liste — d'un `<p>`, il fait une liste *dans* le
 * paragraphe.
 */
export function poserLignes(racine: HTMLElement, lignes: Ligne[]) {
  racine.replaceChildren();
  for (const l of lignes) {
    if (l.genre === "p") {
      const p = document.createElement("div");
      if (l.alignement) {
        p.style.textAlign = l.alignement === "centre" ? "center" : "right";
      }
      poserPassages(p, l.passages);
      // Un paragraphe vide doit garder sa hauteur, et pouvoir recevoir le curseur.
      if (!p.childNodes.length) p.appendChild(document.createElement("br"));
      racine.appendChild(p);
    } else {
      const liste = document.createElement(l.genre);
      for (const item of l.items) {
        const li = document.createElement("li");
        poserPassages(li, item);
        liste.appendChild(li);
      }
      racine.appendChild(liste);
    }
  }
  if (!racine.childNodes.length) {
    const p = document.createElement("div");
    p.appendChild(document.createElement("br"));
    racine.appendChild(p);
  }
}

/* -------------------------------------------------------------------------- */
/* Le curseur, compté en caractères                                           */
/* -------------------------------------------------------------------------- */

/**
 * Une position dans le texte : le nombre de caractères qui la précèdent
 * depuis le début de la zone. `debut` lève le doute aux frontières : la fin
 * d'un paragraphe et le début du suivant ont le même compte.
 */
interface Position {
  n: number;
  debut: boolean;
}
export interface SelectionGardee {
  de: Position;
  a: Position;
}

function compter(
  racine: HTMLElement,
  noeud: Node,
  decalage: number,
): Position | null {
  if (noeud.nodeType !== Node.TEXT_NODE) return null;
  const textes = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
  let n = 0;
  for (let t = textes.nextNode(); t; t = textes.nextNode()) {
    if (t === noeud) return { n: n + decalage, debut: decalage === 0 };
    n += t.nodeValue?.length ?? 0;
  }
  return null;
}

function retrouver(racine: HTMLElement, p: Position): [Node, number] | null {
  const textes = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
  let c = 0;
  for (let t = textes.nextNode(); t; t = textes.nextNode()) {
    const l = t.nodeValue?.length ?? 0;
    if (p.debut ? c === p.n && l > 0 : p.n > c && p.n <= c + l) {
      return [t, p.n - c];
    }
    c += l;
  }
  return null;
}

/**
 * La sélection en cours dans la zone, sous une forme qui survit à un
 * remaniement de ses balises. `null` si elle n'est pas dans du texte — un
 * paragraphe encore vide, par exemple.
 */
export function garderSelection(racine: HTMLElement): SelectionGardee | null {
  const selection = document.getSelection();
  if (!selection?.rangeCount) return null;
  const plage = selection.getRangeAt(0);
  const de = compter(racine, plage.startContainer, plage.startOffset);
  const a = compter(racine, plage.endContainer, plage.endOffset);
  return de && a ? { de, a } : null;
}

/** Remet la sélection gardée, une fois les balises remaniées. */
export function rendreSelection(racine: HTMLElement, gardee: SelectionGardee) {
  const de = retrouver(racine, gardee.de);
  const a = retrouver(racine, gardee.a);
  const selection = document.getSelection();
  if (!de || !a || !selection) return;
  const plage = document.createRange();
  plage.setStart(de[0], de[1]);
  plage.setEnd(a[0], a[1]);
  selection.removeAllRanges();
  selection.addRange(plage);
}
