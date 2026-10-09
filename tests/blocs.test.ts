import { describe, expect, it } from "vitest";
import {
  PLAFOND_BLOCS,
  PLAFOND_TEXTE,
  blocsEnregistres,
  estFichierBloc,
  estJeton,
  etiquettePage,
  fichiersDesBlocs,
  lienSur,
  lienVideo,
  lireBlocs,
  typeFichierBloc,
  type Bloc,
} from "@/lib/blocs";

const JETON = "televersement:0f8fad5b-d9cb-469f-a165-70867728950e";
const blocs = (valeur: unknown): Bloc[] => {
  const lecture = lireBlocs(valeur);
  if (lecture.erreur !== undefined) throw new Error(lecture.erreur);
  return lecture.blocs;
};
const texte = (...passages: unknown[]) => [
  { type: "texte", lignes: [{ genre: "p", passages }] },
];

describe("liens posés dans un texte", () => {
  it("garde une adresse web, et complète celle qui n'a pas de protocole", () => {
    expect(lienSur("https://cancham.mg/adhesion")).toBe(
      "https://cancham.mg/adhesion",
    );
    expect(lienSur("cancham.mg/adhesion")).toBe("https://cancham.mg/adhesion");
    expect(lienSur("  http://exemple.org  ")).toBe("http://exemple.org/");
  });

  it("garde un courriel, un téléphone, un chemin de la plateforme", () => {
    expect(lienSur("mailto:info@cancham.mg")).toBe("mailto:info@cancham.mg");
    expect(lienSur("tel:+261340000000")).toBe("tel:+261340000000");
    expect(lienSur("/membre/evenements")).toBe("/membre/evenements");
  });

  it("refuse tout ce qui exécuterait du code ou sortirait par une ruse", () => {
    expect(lienSur("javascript:alert(1)")).toBeNull();
    expect(lienSur("JaVaScRiPt:alert(1)")).toBeNull();
    expect(lienSur("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(lienSur("vbscript:msgbox(1)")).toBeNull();
    expect(lienSur("//pirate.example/page")).toBeNull();
    expect(lienSur('https://a.mg/"onmouseover="alert(1)')).toBeNull();
    expect(lienSur("https://a.mg/ b")).toBeNull();
    expect(lienSur("")).toBeNull();
    expect(lienSur("localhost")).toBeNull();
  });
});

describe("vidéos données par un lien", () => {
  it("reconnaît les adresses YouTube, sous toutes leurs formes", () => {
    const attendu = "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?rel=0";
    for (const lien of [
      "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
      "https://youtube.com/watch?v=aqz-KE-bpKQ&t=42s",
      "https://m.youtube.com/watch?v=aqz-KE-bpKQ",
      "https://youtu.be/aqz-KE-bpKQ?si=abc",
      "https://www.youtube.com/embed/aqz-KE-bpKQ",
      "https://www.youtube.com/shorts/aqz-KE-bpKQ",
      "youtu.be/aqz-KE-bpKQ",
    ]) {
      expect(lienVideo(lien), lien).toEqual({
        plateforme: "youtube",
        integration: attendu,
      });
    }
  });

  it("reconnaît les adresses Vimeo, clé d'une vidéo non répertoriée comprise", () => {
    expect(lienVideo("https://vimeo.com/76979871")?.integration).toBe(
      "https://player.vimeo.com/video/76979871",
    );
    expect(
      lienVideo("https://vimeo.com/76979871/abcdef1234")?.integration,
    ).toBe("https://player.vimeo.com/video/76979871?h=abcdef1234");
    expect(
      lienVideo("https://player.vimeo.com/video/76979871?h=abcdef1234")
        ?.integration,
    ).toBe("https://player.vimeo.com/video/76979871?h=abcdef1234");
    expect(
      lienVideo("https://vimeo.com/channels/staffpicks/76979871")?.plateforme,
    ).toBe("vimeo");
  });

  it("reconnaît les fichiers Google Drive, pas ses dossiers", () => {
    const id = "1A2b3C4d5E6f7G8h9I0jK1L2m3N4o5P6q";
    const attendu = {
      plateforme: "drive",
      integration: `https://drive.google.com/file/d/${id}/preview`,
    };
    for (const lien of [
      `https://drive.google.com/file/d/${id}/view?usp=sharing`,
      `https://drive.google.com/file/d/${id}/view?usp=drive_link`,
      `https://drive.google.com/file/u/1/d/${id}/preview`,
      `https://drive.google.com/open?id=${id}`,
      `https://drive.google.com/uc?id=${id}&export=download`,
      `drive.google.com/file/d/${id}/view`,
    ]) {
      expect(lienVideo(lien), lien).toEqual(attendu);
    }
    expect(
      lienVideo(
        `https://drive.google.com/file/d/${id}/view?resourcekey=0-AbC_dEf-123`,
      )?.integration,
    ).toBe(
      `https://drive.google.com/file/d/${id}/preview?resourcekey=0-AbC_dEf-123`,
    );
    for (const lien of [
      `https://drive.google.com/drive/folders/${id}`,
      `https://drive.google.com/drive/u/0/my-drive`,
      `https://drive.google.com.pirate.example/file/d/${id}/view`,
      `https://pirate.example/drive.google.com/file/d/${id}/view`,
      "https://drive.google.com/file/d/../view",
      `https://drive.google.com/file/d/${id}%22onload/view`,
      "https://drive.google.com/open?id=court",
    ]) {
      expect(lienVideo(lien), lien).toBeNull();
    }
  });

  it("refuse tout autre hébergeur, et les adresses qui en imitent un", () => {
    for (const lien of [
      "https://exemple.com/video.mp4",
      "https://youtube.com.pirate.example/watch?v=aqz-KE-bpKQ",
      "https://pirate.example/youtube.com/watch?v=aqz-KE-bpKQ",
      "https://www.youtube.com/watch?v=trop-court",
      "https://www.youtube.com/watch?v=aqz-KE-bpKQ%22onload",
      "https://www.youtube.com/",
      "https://vimeo.com/categories/animation",
      "javascript:alert(1)",
      "",
    ]) {
      expect(lienVideo(lien), lien).toBeNull();
    }
  });

  it("ne laisse passer dans l'adresse du cadre que l'identifiant", () => {
    const video = lienVideo(
      "https://www.youtube.com/watch?v=aqz-KE-bpKQ&autoplay=1&list=PL123",
    );
    expect(video?.integration).toBe(
      "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?rel=0",
    );
  });
});

describe("fichiers des blocs", () => {
  it("ne reconnaît que les noms fabriqués par la plateforme", () => {
    expect(estFichierBloc("photo-0123456789abcdef.webp")).toBe(true);
    expect(estFichierBloc("video-0123456789abcdef.mp4")).toBe(true);
    expect(estFichierBloc("video-0123456789abcdef.webm")).toBe(true);
    for (const nom of [
      "../document.pdf",
      "photo-0123456789abcdef.webp/../../x",
      "photo-0123456789abcdef.png",
      "photo-0123456789ABCDEF.webp",
      "photo-123.webp",
      "video-0123456789abcdef.exe",
      "document.pdf",
      ".env",
      "",
    ]) {
      expect(estFichierBloc(nom), nom).toBe(false);
    }
  });

  it("sert chaque fichier sous son type", () => {
    expect(typeFichierBloc("photo-0123456789abcdef.webp")).toBe("image/webp");
    expect(typeFichierBloc("video-0123456789abcdef.mp4")).toBe("video/mp4");
    expect(typeFichierBloc("video-0123456789abcdef.webm")).toBe("video/webm");
    expect(typeFichierBloc("video-0123456789abcdef.mov")).toBe(
      "video/quicktime",
    );
  });

  it("distingue le jeton d'un envoi d'un fichier rangé", () => {
    expect(estJeton(JETON)).toBe(true);
    expect(estJeton("televersement:../../etc/passwd")).toBe(false);
    expect(estJeton("photo-0123456789abcdef.webp")).toBe(false);
  });
});

describe("lecture d'une page saisie", () => {
  it("garde une page bien formée, telle quelle", () => {
    const page: Bloc[] = [
      { type: "titre", texte: "Exporter au Québec", niveau: 2 },
      {
        type: "texte",
        lignes: [
          {
            genre: "p",
            passages: [
              { t: "Un " },
              { t: "mot", g: true, couleur: "#ad0707", taille: "grand" },
              { t: " lié", lien: "https://cancham.mg/" },
            ],
            alignement: "centre",
          },
          { genre: "ul", items: [[{ t: "Un" }], [{ t: "Deux", i: true }]] },
        ],
      },
      { type: "photo", fichier: "photo-0123456789abcdef.webp", legende: "Vue" },
      { type: "video", source: "lien", url: "https://youtu.be/aqz-KE-bpKQ" },
      { type: "video", source: "fichier", fichier: JETON },
    ];
    expect(blocs(page)).toEqual(page);
  });

  it("ne garde d'un passage que les marques connues", () => {
    const [bloc] = blocs(
      texte({
        t: "texte",
        g: "oui",
        i: 1,
        s: true,
        html: "<script>alert(1)</script>",
        style: "position:fixed",
        onclick: "alert(1)",
        taille: "enorme",
      }),
    );
    expect(bloc).toEqual({
      type: "texte",
      lignes: [{ genre: "p", passages: [{ t: "texte", s: true }] }],
    });
  });

  it("laisse une balise tapée à l'état de texte", () => {
    const [bloc] = blocs(texte({ t: "<img src=x onerror=alert(1)>" }));
    expect(bloc).toMatchObject({
      lignes: [{ passages: [{ t: "<img src=x onerror=alert(1)>" }] }],
    });
  });

  it("écarte un lien dangereux et une couleur qui n'en est pas une", () => {
    const [bloc] = blocs(
      texte(
        { t: "a", lien: "javascript:alert(1)" },
        { t: "b", couleur: "red;background:url(//pirate.example)" },
        { t: "c", couleur: "#AD0707" },
      ),
    );
    expect(bloc).toMatchObject({
      lignes: [{ passages: [{ t: "ab" }, { t: "c", couleur: "#ad0707" }] }],
    });
  });

  it("réunit les passages voisins de même mise en forme", () => {
    const [bloc] = blocs(
      texte({ t: "Bon" }, { t: "jour" }, { t: "!", g: true }),
    );
    expect(bloc).toMatchObject({
      lignes: [{ passages: [{ t: "Bonjour" }, { t: "!", g: true }] }],
    });
  });

  it("n'enregistre pas les blocs laissés vides", () => {
    expect(
      blocs([
        { type: "titre", texte: "   ", niveau: 2 },
        { type: "texte", lignes: [{ genre: "p", passages: [{ t: " \n " }] }] },
        { type: "texte", lignes: [{ genre: "ul", items: [[{ t: " " }]] }] },
        { type: "photo", fichier: "" },
        { type: "video", source: "lien", url: "  " },
        { type: "video", source: "fichier", fichier: "" },
      ]),
    ).toEqual([]);
  });

  it("retire les lignes blanches du début et de la fin, pas celles du milieu", () => {
    const vide = { genre: "p", passages: [] };
    const ligne = (t: string) => ({ genre: "p", passages: [{ t }] });
    const [bloc] = blocs([
      { type: "texte", lignes: [vide, ligne("a"), vide, ligne("b"), vide] },
    ]);
    expect(bloc).toEqual({
      type: "texte",
      lignes: [ligne("a"), vide, ligne("b")],
    });
  });

  it("garde la couleur d'un titre, si c'en est une", () => {
    expect(
      blocs([
        { type: "titre", texte: "Rouge", niveau: 2, couleur: "#AD0707" },
        {
          type: "titre",
          texte: "Rien",
          niveau: 3,
          couleur: "red;display:none",
        },
      ]),
    ).toEqual([
      { type: "titre", texte: "Rouge", niveau: 2, couleur: "#ad0707" },
      { type: "titre", texte: "Rien", niveau: 3 },
    ]);
  });

  it("ramène un titre à une ligne, et un niveau inconnu au grand titre", () => {
    expect(
      blocs([{ type: "titre", texte: "  Un\n  titre\t long ", niveau: 7 }]),
    ).toEqual([{ type: "titre", texte: "Un titre long", niveau: 2 }]);
  });

  it("borne la longueur d'un texte", () => {
    const [bloc] = blocs(texte({ t: "a".repeat(PLAFOND_TEXTE + 500) }));
    expect(bloc.type === "texte" && bloc.lignes[0]).toMatchObject({
      passages: [{ t: "a".repeat(PLAFOND_TEXTE) }],
    });
  });

  it("refuse une page mal formée plutôt que d'en perdre un morceau", () => {
    for (const page of [
      null,
      "texte",
      { type: "texte" },
      [{ type: "script", code: "alert(1)" }],
      [{ type: "texte", lignes: "du texte" }],
      [{ type: "texte", lignes: [{ genre: "table", passages: [] }] }],
      [
        {
          type: "texte",
          lignes: [{ genre: "p", passages: [{ html: "<b>" }] }],
        },
      ],
      [{ type: "photo", fichier: "../../.env" }],
      [{ type: "photo", fichier: "video-0123456789abcdef.mp4" }],
      [{ type: "video", source: "fichier", fichier: "/etc/passwd" }],
      [{ type: "video", source: "ailleurs", url: "https://youtu.be/x" }],
      [null],
    ]) {
      expect(lireBlocs(page).erreur, JSON.stringify(page)).toBeTypeOf("string");
    }
  });

  it("dit pourquoi un lien de vidéo est refusé", () => {
    expect(
      lireBlocs([
        { type: "video", source: "lien", url: "https://exemple.com/v.mp4" },
      ]).erreur,
    ).toMatch(/YouTube, Vimeo ou Google Drive/);
  });

  it("borne le nombre de blocs d'une page", () => {
    const titre = { type: "titre", texte: "t", niveau: 2 };
    expect(blocs(Array(PLAFOND_BLOCS).fill(titre))).toHaveLength(PLAFOND_BLOCS);
    expect(lireBlocs(Array(PLAFOND_BLOCS + 1).fill(titre)).erreur).toMatch(
      /blocs au plus/,
    );
  });

  it("lit une page abîmée en base comme une page vide", () => {
    expect(blocsEnregistres(null)).toEqual([]);
    expect(blocsEnregistres({ pas: "une liste" })).toEqual([]);
    expect(blocsEnregistres([{ type: "inconnu" }])).toEqual([]);
  });
});

describe("ce qu'une page emploie et annonce", () => {
  const page: Bloc[] = [
    { type: "titre", texte: "Guide", niveau: 2 },
    { type: "photo", fichier: "photo-0123456789abcdef.webp" },
    { type: "video", source: "lien", url: "https://youtu.be/aqz-KE-bpKQ" },
    { type: "video", source: "fichier", fichier: "video-0123456789abcdef.mp4" },
  ];

  it("liste les fichiers de ses blocs, pas les liens", () => {
    expect(fichiersDesBlocs(page)).toEqual([
      "photo-0123456789abcdef.webp",
      "video-0123456789abcdef.mp4",
    ]);
  });

  it("résume son contenu pour l'étiquette de la carte", () => {
    expect(etiquettePage(page)).toBe("2 vidéos · 1 photo");
    expect(etiquettePage([{ type: "titre", texte: "Guide", niveau: 2 }])).toBe(
      "Page",
    );
    const long: Bloc = {
      type: "texte",
      lignes: [{ genre: "p", passages: [{ t: "mot ".repeat(600) }] }],
    };
    expect(etiquettePage([long])).toBe("3 min de lecture");
    expect(etiquettePage([long, ...page])).toBe("3 min de lecture · 2 vidéos");
  });
});
