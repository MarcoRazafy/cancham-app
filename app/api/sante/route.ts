import { access, constants, mkdir } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { RACINE_STOCKAGE } from "@/lib/stockage";

export async function GET() {
  const [base, stockage] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(
      () => true,
      () => false,
    ),
    mkdir(RACINE_STOCKAGE, { recursive: true })
      .then(() => access(RACINE_STOCKAGE, constants.W_OK))
      .then(
        () => true,
        () => false,
      ),
  ]);
  const ok = base && stockage;
  return Response.json(
    {
      etat: ok ? "ok" : "degrade",
      base: base ? "ok" : "injoignable",
      stockage: stockage ? "ok" : "inaccessible",
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
