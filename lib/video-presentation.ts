export const PLAFOND_VIDEO = 1024 * 1024 * 1024;

export const MORCEAU_VIDEO = 8 * 1024 * 1024;

export const FORMATS_VIDEO = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
} as const;

export type FormatVideo = keyof typeof FORMATS_VIDEO;

export const ACCEPT_VIDEO =
  "video/mp4,video/webm,video/quicktime,.mp4,.m4v,.webm,.mov";

export function formatVideo(nom: string): FormatVideo | null {
  const extension = /\.([a-z0-9]+)$/i.exec(nom.trim())?.[1]?.toLowerCase();
  if (extension === "mp4" || extension === "m4v") return "mp4";
  if (extension === "webm") return "webm";
  if (extension === "mov") return "mov";
  return null;
}

export function signatureVideo(
  debut: Uint8Array,
  format: FormatVideo,
): boolean {
  if (debut.length < 8) return false;
  if (format === "webm") {
    return (
      debut[0] === 0x1a &&
      debut[1] === 0x45 &&
      debut[2] === 0xdf &&
      debut[3] === 0xa3
    );
  }
  const boite = String.fromCharCode(...debut.subarray(4, 8));
  return format === "mp4"
    ? boite === "ftyp"
    : ["ftyp", "moov", "mdat", "wide", "free", "skip"].includes(boite);
}

const NOM_VIDEO = /^video-[A-Za-z0-9]+-[0-9a-f]{16}\.(mp4|webm|mov)$/;

export function estNomVideo(nom: string): boolean {
  return NOM_VIDEO.test(nom);
}

export function nomVideo(
  memberId: string,
  alea: string,
  format: FormatVideo,
): string {
  return `video-${memberId.replace(/[^A-Za-z0-9]/g, "")}-${alea}.${format}`;
}

export function typeVideo(fichier: string): string {
  return FORMATS_VIDEO[formatVideo(fichier) ?? "mp4"];
}

export function urlVideo(fichier: string): string {
  return `/api/videos/${fichier}`;
}

export function poidsLisible(octets: number): string {
  const mo = octets / (1024 * 1024);
  if (mo < 1) return "moins de 1 Mo";
  if (mo < 1000) return `${Math.round(mo)} Mo`;
  return `${(mo / 1024).toFixed(1).replace(".", ",")} Go`;
}
