import { conversationVisiteur } from "@/lib/support-visiteur";

const SANS_CACHE = { "Cache-Control": "no-store" };

export async function GET() {
  return Response.json(
    { fil: await conversationVisiteur() },
    { headers: SANS_CACHE },
  );
}
