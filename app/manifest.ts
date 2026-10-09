import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "CanCham Connect",
    short_name: "CanCham",
    description:
      "L’espace des membres de la Chambre de Commerce et de Coopération Canada–Madagascar : événements, annuaire, messagerie, cotisations.",
    lang: "fr",
    dir: "ltr",
    start_url: "/auth?source=application",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f1d2c",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icones/icone-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icones/icone-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icones/icone-masquable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
