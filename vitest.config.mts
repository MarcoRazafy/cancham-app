import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const racine = fileURLToPath(new URL(".", import.meta.url));

/**
 * Tests des règles qui ne doivent jamais casser : accès selon la
 * cotisation, dates, mots de passe, sessions, limitation des tentatives,
 * saisies dangereuses.
 *
 * Ce sont des fonctions pures, testées sans base ni navigateur. Le fuseau
 * est celui de la chambre, comme dans l'image de production.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": racine,
      // Le vrai module refuse d'être importé hors d'un composant serveur.
      "server-only": `${racine}tests/server-only.ts`,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: { TZ: "Indian/Antananarivo", AUTH_SECRET: "cle-de-test" },
  },
});
