import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Adresses autorisées à interroger le serveur de développement.
   *
   * Next n'accepte que `localhost` par défaut et bloque le reste. Ouvert
   * depuis un téléphone sur le même réseau — http://192.168.1.34:3000 —, le
   * site s'affichait mais restait inerte : le menu ne s'ouvrait pas, aucun
   * bouton ne répondait. Sans effet en production.
   */
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "100.*.*.*", "172.16.*.*"],

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
