import type { NextRequest } from "next/server";
import { ecartJours, estJourISO } from "@/lib/agenda";
import { isAccessLocked } from "@/lib/membership";
import { getAgenda, getAgendaEquipe, getMember } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

/** Au plus six semaines : la grille d'un mois, pas un export de l'année. */
const JOURS_MAX = 42;

/**
 * Éléments d'agenda d'une période, pour la bulle flottante.
 *
 * La bulle vit dans la coquille, sur toutes les pages : elle charge à la
 * demande le mois qu'elle affiche plutôt que d'alourdir chaque rendu.
 */
export async function GET(requete: NextRequest) {
  const p = requete.nextUrl.searchParams;
  const espace = p.get("espace") === "admin" ? "admin" : "membre";
  const du = p.get("du");
  const au = p.get("au");

  if (!estJourISO(du) || !estJourISO(au)) {
    return Response.json({ message: "Période invalide." }, { status: 400 });
  }
  const jours = ecartJours(du, au);
  if (jours < 0 || jours > JOURS_MAX) {
    return Response.json({ message: "Période trop longue." }, { status: 400 });
  }

  const user = await getCurrentUser(espace);
  if (espace === "admin") {
    return Response.json(
      { elements: await getAgendaEquipe(user.id, du, au) },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  // Même règle que le verrou des pages : un membre restreint n'a que son
  // profil et ses cotisations.
  const membre = user.memberId ? await getMember(user.memberId) : null;
  if (!membre || isAccessLocked(membre)) {
    return Response.json({ message: "Accès restreint." }, { status: 403 });
  }
  return Response.json(
    {
      elements: await getAgenda(
        { userId: user.id, memberId: membre.id },
        du,
        au,
      ),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
