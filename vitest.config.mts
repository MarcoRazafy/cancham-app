import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const racine = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": racine,
      "server-only": `${racine}tests/server-only.ts`,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: { TZ: "Indian/Antananarivo", AUTH_SECRET: "cle-de-test" },
  },
});
