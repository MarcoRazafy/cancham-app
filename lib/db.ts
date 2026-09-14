import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Client Prisma partagé.
 *
 * En développement, Next.js recharge les modules à chaque modification : sans
 * ce cache sur `globalThis`, chaque rechargement ouvrirait un nouveau pool de
 * connexions et finirait par saturer PostgreSQL.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
