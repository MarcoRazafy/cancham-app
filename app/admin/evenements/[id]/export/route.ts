import { reponseCsv, versCsv } from "@/lib/csv";
import { getParticipants } from "@/lib/queries-admin";

const STATUTS = { confirme: "Inscrit", present: "Présent", absent: "Absent" };

/** Liste d'accueil d'un événement au format tableur. */
export async function GET(
  _requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const participants = await getParticipants(id);
  const csv = versCsv(
    ["Nom", "Entreprise", "E-mail", "Statut"],
    participants.map((p) => [p.nom, p.entreprise, p.email, STATUTS[p.statut]]),
  );
  return reponseCsv(`participants-${id}`, csv);
}
