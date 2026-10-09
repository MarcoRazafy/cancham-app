import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  conversationEquipe,
  supportEquipe,
  supportMembre,
} from "@/lib/support";

const SANS_CACHE = { "Cache-Control": "no-store" };

export async function GET(requete: NextRequest) {
  const p = requete.nextUrl.searchParams;
  const espace = p.get("espace") === "admin" ? "admin" : "membre";
  const user = await getCurrentUser(espace);

  if (espace === "membre") {
    return Response.json(await supportMembre(user.id), {
      headers: SANS_CACHE,
    });
  }

  const t = p.get("t");
  const [liste, conversation] = await Promise.all([
    supportEquipe(user.id),
    t ? conversationEquipe(t, user.id) : null,
  ]);
  return Response.json({ ...liste, conversation }, { headers: SANS_CACHE });
}
