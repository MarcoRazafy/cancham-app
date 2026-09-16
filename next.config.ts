import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /**
       * Taille maximale d'un envoi vers une action serveur.
       *
       * Next la fixe à 1 Mo par défaut : une seule photo de téléphone la
       * dépasse, et l'envoi échouait sans message — « The destination stream
       * closed early » côté serveur, rien côté membre. Couvertures, logos,
       * photos de services, portraits et pièces jointes en dépendent.
       *
       * 40 Mo : cinq photos de téléphone d'un coup, ou une courte vidéo en
       * pièce jointe. Chaque action vérifie ensuite ses propres plafonds par
       * fichier ; celui-ci ne borne que la requête entière.
       */
      bodySizeLimit: "40mb",
    },
  },
  images: {
    /**
     * Hébergeurs autorisés pour les visuels de l'espace public.
     *
     * Unsplash et Pexels permettent le lien direct et servent des URL stables.
     * Next optimise et met en cache ces images côté serveur : le visiteur ne
     * dépend donc pas de la disponibilité de l'hébergeur à chaque chargement.
     */
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
};

export default nextConfig;
