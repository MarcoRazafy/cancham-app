import type { MetadataRoute } from "next";

/**
 * L'application CanCham, telle qu'on l'installe sur un téléphone ou un
 * ordinateur.
 *
 * Elle s'ouvre sur la connexion, pas sur le site : un membre déjà connecté
 * y est aussitôt renvoyé vers son espace — l'équipe vers le back-office —,
 * les autres voient le formulaire. La vitrine, elle, reste l'affaire du
 * navigateur : dans l'application, ses pages renvoient vers l'espace membre
 * (voir `RenvoiApplication`).
 *
 * Le périmètre couvre tout le site, faute de mieux : il ne peut désigner
 * qu'un seul chemin, et la connexion (`/auth`) doit rester dans la fenêtre
 * de l'application au même titre que `/membre` et `/admin`.
 */
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
    // Le bleu de la barre supérieure des espaces : la barre d'état du
    // téléphone le prolonge.
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
        // Android découpe parfois l'icône en cercle : le logo y tient dans
        // la zone sûre du centre.
        src: "/icones/icone-masquable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
