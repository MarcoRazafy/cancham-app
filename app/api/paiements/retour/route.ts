import { type NextRequest } from "next/server";
import { destinationDuRetour } from "@/lib/retour-paiement";

function relais(request: NextRequest) {
  const destination = destinationDuRetour(
    request.nextUrl.searchParams.get("vers"),
  );
  return new Response(null, {
    status: 303,
    headers: { Location: destination, "Cache-Control": "no-store" },
  });
}

export const GET = relais;
export const POST = relais;
