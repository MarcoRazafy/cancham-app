import { access, constants, mkdir } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { RACINE_STOCKAGE } from "@/lib/stockage";

/**
 * État de santé, pour Railway : il n'envoie le trafic vers une nouvelle
 * version que lorsque cette adresse répond 200, et garde l'ancienne sinon.
 *
 * On vérifie ce sans quoi la plateforme ne sert à rien : la base répond, et
 * le volume de stockage est monté et accessible en écriture. La réponse ne
 * dit rien de plus — l'adresse est publique.
 */
export async function GET() {
  const [base, stockage] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(
      () => true,
      () => false,
    ),
    // Sur un volume neuf, le dossier n'existe pas encore.
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
