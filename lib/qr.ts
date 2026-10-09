import "server-only";

import QRCode from "qrcode";

export function matriceQr(texte: string): { taille: number; modules: string } {
  const { modules } = QRCode.create(texte, { errorCorrectionLevel: "M" });
  return {
    taille: modules.size,
    modules: Array.from(modules.data, (m) => (m ? "1" : "0")).join(""),
  };
}

export async function pngQr(texte: string): Promise<Buffer> {
  return QRCode.toBuffer(texte, {
    errorCorrectionLevel: "M",
    type: "png",
    scale: 6,
    margin: 2,
    color: { dark: "#0f1d2cff", light: "#ffffffff" },
  });
}
