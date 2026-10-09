import { describe, expect, it } from "vitest";
import {
  estNomVideo,
  formatVideo,
  MORCEAU_VIDEO,
  nomVideo,
  PLAFOND_VIDEO,
  poidsLisible,
  signatureVideo,
  typeVideo,
  urlVideo,
} from "@/lib/video-presentation";

const octets = (...v: number[]) => new Uint8Array(v);
const boite = (nom: string) =>
  octets(0, 0, 0, 0x20, ...[...nom].map((c) => c.charCodeAt(0)), 0, 0, 0, 0);

describe("plafonds", () => {
  it("borne une vidéo à 1 Go, envoyée par morceaux de 8 Mo", () => {
    expect(PLAFOND_VIDEO).toBe(1024 ** 3);
    expect(MORCEAU_VIDEO).toBe(8 * 1024 ** 2);
  });
});

describe("format d'après le nom", () => {
  it("reconnaît les formats acceptés, quelle que soit la casse", () => {
    expect(formatVideo("presentation.mp4")).toBe("mp4");
    expect(formatVideo("Présentation 2026.MP4")).toBe("mp4");
    expect(formatVideo("clip.m4v")).toBe("mp4");
    expect(formatVideo("clip.webm")).toBe("webm");
    expect(formatVideo("IMG_0042.MOV")).toBe("mov");
  });

  it("refuse le reste", () => {
    for (const nom of [
      "video.avi",
      "video.mkv",
      "video.mp4.exe",
      "video",
      "mp4",
      "page.html",
      "",
    ]) {
      expect(formatVideo(nom)).toBeNull();
    }
  });
});

describe("signature du fichier", () => {
  it("reconnaît un MP4 à sa boîte `ftyp`", () => {
    expect(signatureVideo(boite("ftyp"), "mp4")).toBe(true);
  });

  it("reconnaît un WebM à son en-tête EBML", () => {
    expect(
      signatureVideo(octets(0x1a, 0x45, 0xdf, 0xa3, 1, 0, 0, 0), "webm"),
    ).toBe(true);
  });

  it("accepte un QuickTime qui commence par ses données", () => {
    for (const nom of ["ftyp", "moov", "mdat", "wide", "free"]) {
      expect(signatureVideo(boite(nom), "mov")).toBe(true);
    }
  });

  it("refuse un fichier qui n'a d'une vidéo que le nom", () => {
    const html = new TextEncoder().encode("<!doctype html><script>");
    expect(signatureVideo(html, "mp4")).toBe(false);
    expect(signatureVideo(html, "webm")).toBe(false);
    expect(signatureVideo(html, "mov")).toBe(false);
    expect(signatureVideo(boite("ftyp"), "webm")).toBe(false);
    expect(
      signatureVideo(octets(0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0), "mp4"),
    ).toBe(false);
    expect(signatureVideo(boite("moov"), "mp4")).toBe(false);
  });

  it("refuse un fichier trop court pour être lu", () => {
    expect(signatureVideo(octets(0x1a, 0x45, 0xdf), "webm")).toBe(false);
    expect(signatureVideo(octets(), "mp4")).toBe(false);
  });
});

describe("nom du fichier servi", () => {
  it("fabrique un nom que la plateforme reconnaît", () => {
    const nom = nomVideo(
      "cmupc5t1m0002h7y68jogl3nf",
      "0123456789abcdef",
      "mp4",
    );
    expect(nom).toBe("video-cmupc5t1m0002h7y68jogl3nf-0123456789abcdef.mp4");
    expect(estNomVideo(nom)).toBe(true);
    expect(estNomVideo(nomVideo("m1", "fedcba9876543210", "webm"))).toBe(true);
  });

  it("retire d'un identifiant tout ce qui n'est ni lettre ni chiffre", () => {
    const nom = nomVideo("../../etc/passwd", "0123456789abcdef", "mov");
    expect(nom).toBe("video-etcpasswd-0123456789abcdef.mov");
    expect(estNomVideo(nom)).toBe(true);
  });

  it("ne reconnaît rien d'autre", () => {
    for (const nom of [
      "",
      "video.mp4",
      "../video-m1-0123456789abcdef.mp4",
      "video-m1-0123456789abcdef.mp4/..",
      "video-m1-0123456789abcdef.mp4\n",
      "video-m1-0123456789ABCDEF.mp4",
      "video-m1-0123456789abcde.mp4",
      "video-m1-0123456789abcdef.avi",
      "video-m%2e-0123456789abcdef.mp4",
      "couverture-m1-0123456789abcdef.mp4",
    ]) {
      expect(estNomVideo(nom)).toBe(false);
    }
  });

  it("donne le type et l'adresse de lecture", () => {
    expect(typeVideo("video-m1-0123456789abcdef.mp4")).toBe("video/mp4");
    expect(typeVideo("video-m1-0123456789abcdef.webm")).toBe("video/webm");
    expect(typeVideo("video-m1-0123456789abcdef.mov")).toBe("video/quicktime");
    expect(urlVideo("video-m1-0123456789abcdef.mp4")).toBe(
      "/api/videos/video-m1-0123456789abcdef.mp4",
    );
  });
});

describe("poids lisible", () => {
  it("parle en mégaoctets, puis en gigaoctets", () => {
    expect(poidsLisible(200_000)).toBe("moins de 1 Mo");
    expect(poidsLisible(742 * 1024 ** 2)).toBe("742 Mo");
    expect(poidsLisible(PLAFOND_VIDEO)).toBe("1,0 Go");
    expect(poidsLisible(1.25 * 1024 ** 3)).toBe("1,3 Go");
  });
});
