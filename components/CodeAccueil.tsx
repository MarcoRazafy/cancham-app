"use client";

import { useState } from "react";
import { Download } from "lucide-react";

/**
 * Code d'accueil d'une inscription : le QR code, le code en clair, et de quoi
 * l'enregistrer.
 *
 * Le téléchargement produit un billet en PNG — l'événement, le QR code, le
 * code et le participant — à garder dans sa galerie de photos : on le
 * présente à l'accueil sans connexion, même là où le réseau manque.
 */

interface Billet {
  titre: string;
  /** Date et horaire, déjà mis en forme. */
  quand: string;
  lieu: string;
  /** Nom du participant, et son entreprise. */
  participant: string;
}

/** Marge blanche autour du code, en modules : les lecteurs en ont besoin. */
const MARGE_QR = 2;
const ENCRE = "#0f1d2c";

function chemin(taille: number, modules: string): string {
  let d = "";
  for (let y = 0; y < taille; y++) {
    for (let x = 0; x < taille; x++) {
      if (modules[y * taille + x] === "1") d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return d;
}

export function CodeAccueil({
  code,
  taille,
  modules,
  billet,
}: {
  code: string;
  taille: number;
  modules: string;
  billet: Billet;
}) {
  const [etat, setEtat] = useState<"repos" | "preparation" | "erreur">(
    "repos",
  );
  const cote = taille + 2 * MARGE_QR;

  const telecharger = async () => {
    setEtat("preparation");
    try {
      const image = await dessinerBillet(code, taille, modules, billet);
      const url = URL.createObjectURL(image);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = `cancham-${code}.png`;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2_000);
      setEtat("repos");
    } catch {
      setEtat("erreur");
    }
  };

  return (
    <div className="mt-3.5 p-4 bg-surface-2 rounded-[var(--radius-m)] flex flex-col items-center gap-2.5">
      <div className="bg-white p-2 rounded-lg border border-line">
        <svg
          viewBox={`${-MARGE_QR} ${-MARGE_QR} ${cote} ${cote}`}
          width={150}
          height={150}
          shapeRendering="crispEdges"
          role="img"
          aria-label={`QR code du code d’accueil ${code}`}
          className="block"
        >
          <rect
            x={-MARGE_QR}
            y={-MARGE_QR}
            width={cote}
            height={cote}
            fill="#fff"
          />
          <path d={chemin(taille, modules)} fill={ENCRE} />
        </svg>
      </div>
      <div className="font-[family-name:var(--font-mono)] text-[13px] font-bold tracking-wide">
        {code}
      </div>
      <div className="text-[11.5px] text-faint text-center">
        Présentez ce code à l’accueil pour l’enregistrement
      </div>
      <button
        type="button"
        onClick={telecharger}
        disabled={etat === "preparation"}
        className="mt-1 w-full inline-flex items-center justify-center gap-[7px] rounded-[var(--radius-s)] border border-line bg-surface text-ink text-[13px] font-semibold px-3.5 py-2 cursor-pointer transition-colors hover:border-faint disabled:opacity-60 disabled:cursor-default"
      >
        <Download size={15} />
        {etat === "preparation" ? "Préparation…" : "Télécharger le QR code"}
      </button>
      {etat === "erreur" ? (
        <p role="alert" className="m-0 text-[12px] text-bad text-center">
          Le téléchargement a échoué. Réessayez, ou faites une capture d’écran.
        </p>
      ) : null}
    </div>
  );
}

/* ============================ Billet en PNG ============================ */

const LARGEUR = 1080;
const BORD = 80;
const COTE_QR = 600;

/** Police réellement employée par un élément de la page : le billet lui ressemble. */
const policeDe = (el: Element | null) =>
  getComputedStyle(el ?? document.body).fontFamily || "sans-serif";

const MONO =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

/** Découpe un texte en lignes qui tiennent dans la largeur donnée. */
function lignes(
  ctx: CanvasRenderingContext2D,
  texte: string,
  largeur: number,
  max: number,
): string[] {
  const mots = texte.split(/\s+/);
  const resultat: string[] = [];
  let ligne = "";
  for (const mot of mots) {
    const essai = ligne ? `${ligne} ${mot}` : mot;
    if (ctx.measureText(essai).width <= largeur || !ligne) {
      ligne = essai;
    } else {
      resultat.push(ligne);
      ligne = mot;
    }
  }
  if (ligne) resultat.push(ligne);
  if (resultat.length > max) {
    const coupe = resultat.slice(0, max);
    coupe[max - 1] = `${coupe[max - 1].replace(/\s+\S*$/, "")}…`;
    return coupe;
  }
  return resultat;
}

async function dessinerBillet(
  code: string,
  taille: number,
  modules: string,
  billet: Billet,
): Promise<Blob> {
  const sans = policeDe(document.body);
  const titre = policeDe(document.querySelector("h1"));
  const polices = {
    titre: `700 54px ${titre}`,
    info: `400 30px ${sans}`,
    kicker: `700 24px ${sans}`,
    code: `700 58px ${MONO}`,
    participant: `600 30px ${sans}`,
    pied: `400 25px ${sans}`,
  };
  // Une police déclarée mais pas encore employée par la page n'est pas
  // chargée : le canevas prendrait la police de repli.
  await Promise.all(
    Object.values(polices).map((p) => document.fonts.load(p).catch(() => [])),
  );

  const logo = new window.Image();
  logo.src = "/marque/logo-blanc.png";
  await logo.decode();

  const toile = document.createElement("canvas");
  const ctx = toile.getContext("2d");
  if (!ctx) throw new Error("Canevas indisponible");

  // Mesure du titre d'abord : la hauteur du billet en dépend.
  ctx.font = polices.titre;
  const lignesTitre = lignes(ctx, billet.titre, LARGEUR - 2 * BORD, 3);

  const HAUT_BANDEAU = 220;
  let y = HAUT_BANDEAU + 12 + 78;
  const yTitre = y + 30;
  y = yTitre + lignesTitre.length * 66 + 8;
  const yInfos = y;
  y += 2 * 44 + 40;
  const yQr = y;
  y += COTE_QR + 2 * 36 + 70;
  const yCode = y;
  y += 60;
  const yParticipant = y;
  y += 70;
  const yPied = y;
  const hauteur = y + 70;

  toile.width = LARGEUR;
  toile.height = hauteur;

  // Fond.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, LARGEUR, hauteur);

  // Bandeau aux couleurs de la chambre, logo renversé.
  const fond = ctx.createLinearGradient(0, 0, LARGEUR, 0);
  fond.addColorStop(0, "#14293e");
  fond.addColorStop(1, "#0f1d2c");
  ctx.fillStyle = fond;
  ctx.fillRect(0, 0, LARGEUR, HAUT_BANDEAU);
  const hLogo = 104;
  const lLogo = (logo.naturalWidth / logo.naturalHeight) * hLogo;
  ctx.drawImage(logo, BORD, (HAUT_BANDEAU - hLogo) / 2, lLogo, hLogo);

  const filet = ctx.createLinearGradient(0, 0, LARGEUR, 0);
  filet.addColorStop(0, "#c41414");
  filet.addColorStop(0.5, "#1b3a6b");
  filet.addColorStop(1, "#00a05b");
  ctx.fillStyle = filet;
  ctx.fillRect(0, HAUT_BANDEAU, LARGEUR, 12);

  // Événement.
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ad0707";
  ctx.font = polices.kicker;
  ctx.fillText("CODE D’ACCUEIL", BORD, HAUT_BANDEAU + 12 + 70);

  ctx.fillStyle = ENCRE;
  ctx.font = polices.titre;
  lignesTitre.forEach((l, i) => ctx.fillText(l, BORD, yTitre + 30 + i * 66));

  ctx.fillStyle = "#4a5a6b";
  ctx.font = polices.info;
  ctx.fillText(billet.quand, BORD, yInfos + 30);
  ctx.fillText(billet.lieu, BORD, yInfos + 30 + 44);

  // QR code, sur une carte pâle.
  const xCarte = (LARGEUR - COTE_QR) / 2 - 36;
  ctx.fillStyle = "#f3f5f9";
  ctx.beginPath();
  ctx.roundRect(xCarte, yQr, COTE_QR + 72, COTE_QR + 72, 28);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(xCarte + 16, yQr + 16, COTE_QR + 40, COTE_QR + 40, 18);
  ctx.fill();

  const cote = taille + 2 * MARGE_QR;
  const pas = COTE_QR / cote;
  const x0 = (LARGEUR - COTE_QR) / 2 + MARGE_QR * pas;
  const y0 = yQr + 36 + MARGE_QR * pas;
  ctx.fillStyle = ENCRE;
  for (let r = 0; r < taille; r++) {
    for (let c = 0; c < taille; c++) {
      if (modules[r * taille + c] === "1") {
        // Arrondis au pixel, légèrement débordants : pas de filet blanc
        // entre deux modules voisins.
        ctx.fillRect(
          Math.floor(x0 + c * pas),
          Math.floor(y0 + r * pas),
          Math.ceil(pas) + 1,
          Math.ceil(pas) + 1,
        );
      }
    }
  }

  // Code en clair, participant, consigne.
  ctx.textAlign = "center";
  ctx.fillStyle = ENCRE;
  ctx.font = polices.code;
  ctx.fillText(code, LARGEUR / 2, yCode);

  ctx.font = polices.participant;
  ctx.fillText(billet.participant, LARGEUR / 2, yParticipant);

  ctx.fillStyle = "#6b7a8a";
  ctx.font = polices.pied;
  ctx.fillText(
    "Présentez ce code à l’accueil pour l’enregistrement",
    LARGEUR / 2,
    yPied,
  );

  return new Promise((resolve, reject) =>
    toile.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image vide"))),
      "image/png",
    ),
  );
}
