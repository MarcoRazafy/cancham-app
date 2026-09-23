import "server-only";

import QRCode from "qrcode";

/**
 * Matrice d'un QR code, calculée côté serveur.
 *
 * Le navigateur ne reçoit que les modules — une chaîne de « 0 » et de « 1 »
 * —, pas la bibliothèque d'encodage : il lui suffit de les dessiner, à
 * l'écran comme dans l'image téléchargée.
 *
 * Correction d'erreur « M » : le code reste lisible abîmé à 15 %, sur un
 * écran de téléphone rayé ou une impression pâle.
 */
export function matriceQr(texte: string): { taille: number; modules: string } {
  const { modules } = QRCode.create(texte, { errorCorrectionLevel: "M" });
  return {
    taille: modules.size,
    modules: Array.from(modules.data, (m) => (m ? "1" : "0")).join(""),
  };
}

/**
 * Le même code, en PNG, pour les e-mails : une image toute faite.
 *
 * Une messagerie ne dessine pas de matrice — elle affiche une image jointe.
 * Six pixels par module, avec la marge blanche que les lecteurs réclament.
 */
export async function pngQr(texte: string): Promise<Buffer> {
  return QRCode.toBuffer(texte, {
    errorCorrectionLevel: "M",
    type: "png",
    scale: 6,
    margin: 2,
    color: { dark: "#0f1d2cff", light: "#ffffffff" },
  });
}
