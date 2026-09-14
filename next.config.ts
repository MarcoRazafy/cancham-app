import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
