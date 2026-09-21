import type { NextConfig } from "next";

/**
 * Politique de sécurité du contenu.
 *
 * Elle dit au navigateur d'où le code, les images et les connexions ont le
 * droit de venir : un script injecté depuis un autre site ne s'exécute pas,
 * et la page ne peut pas être enfermée dans une iframe tierce
 * (`frame-ancestors`), ce qui coupe court au détournement de clic.
 *
 * `'unsafe-inline'` reste nécessaire pour les scripts et les styles que Next
 * insère dans la page ; le remplacer par un nonce demanderait de rendre
 * chaque page dynamiquement. En développement, Turbopack recompile à chaud :
 * il lui faut `'unsafe-eval'` et la connexion WebSocket.
 */
function politiqueContenu(dev: boolean): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https://images.unsplash.com https://images.pexels.com",
    "media-src 'self' blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    `connect-src 'self'${dev ? " ws: wss:" : ""}`,
  ].join("; ");
}

const nextConfig: NextConfig = {
  /**
   * En-têtes de sécurité, sur toutes les pages.
   *
   * Ils ne remplacent pas les contrôles du serveur : ils ferment les portes
   * que le navigateur laisse ouvertes par défaut — deviner le type d'un
   * fichier envoyé, afficher le site dans l'iframe d'un autre, divulguer
   * l'adresse complète en partant vers un site tiers, ou laisser une page
   * réclamer le micro et la position.
   */
  async headers() {
    const dev = process.env.NODE_ENV !== "production";
    const entetes = [
      { key: "Content-Security-Policy", value: politiqueContenu(dev) },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        // La caméra sert au scanner de QR codes, et à rien d'autre.
        value: "camera=(self), microphone=(), geolocation=(), payment=()",
      },
      ...(dev
        ? []
        : [
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            },
          ]),
    ];
    return [{ source: "/:chemin*", headers: entetes }];
  },

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
