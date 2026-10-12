import { type NextRequest } from "next/server";
import { destinationDuRetour, hoteLocal } from "@/lib/retour-paiement";

function relais(request: NextRequest) {
  const parametres = request.nextUrl.searchParams;
  const destination = destinationDuRetour(parametres.get("vers"));
  const hote =
    process.env.NODE_ENV === "production"
      ? null
      : hoteLocal(parametres.get("local"));
  const port =
    request.nextUrl.port || (request.headers.get("host") ?? "").split(":")[1];
  return new Response(null, {
    status: 303,
    headers: {
      Location: hote
        ? `http://${hote}${port ? `:${port}` : ""}${destination}`
        : destination,
      "Cache-Control": "no-store",
    },
  });
}

export const GET = relais;
export const POST = relais;
