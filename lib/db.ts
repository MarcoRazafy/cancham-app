import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Client Prisma partagé.
 *
 * En développement, Next.js recharge les modules à chaque modification : sans
 * ce cache sur `globalThis`, chaque rechargement ouvrirait un nouveau pool de
 * connexions et finirait par saturer PostgreSQL.
 *
 * Le cache ne vaut que pour la classe qui a créé le client. Après un
 * `prisma generate`, le module généré est rechargé et sa classe n'est plus la
 * même : garder l'ancien client, c'était ignorer les colonnes ajoutées
 * jusqu'au redémarrage du serveur. On en crée donc un neuf, et l'ancien
 * rend ses connexions.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  /** La classe dont `prisma` est sorti — celle du schéma d'alors. */
  prismaClasse?: typeof PrismaClient;
};

/**
 * Schéma PostgreSQL visé : le paramètre `?schema=` de l'adresse, comme pour
 * les migrations, `public` à défaut. L'adaptateur ne le lit pas de lui-même :
 * sans cela, les migrations et l'application pourraient viser deux schémas
 * différents.
 */
function schemaDe(adresse: string | undefined): string | undefined {
  try {
    return new URL(adresse ?? "").searchParams.get("schema") || undefined;
  } catch {
    return undefined;
  }
}

function createClient() {
  const adapter = new PrismaPg(
    { connectionString: process.env.DATABASE_URL },
    { schema: schemaDe(process.env.DATABASE_URL) },
  );
  return new PrismaClient({ adapter });
}

const enCache =
  globalForPrisma.prismaClasse === PrismaClient
    ? globalForPrisma.prisma
    : undefined;

export const prisma = enCache ?? createClient();

if (process.env.NODE_ENV !== "production") {
  const ancien = globalForPrisma.prisma;
  if (ancien && ancien !== prisma) void ancien.$disconnect().catch(() => {});
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaClasse = PrismaClient;
}
