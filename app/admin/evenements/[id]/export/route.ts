import { exigerEquipe } from "@/lib/autorisations";
import { reponseCsv, versCsv } from "@/lib/csv";
import { marquerAbsentsPasses } from "@/lib/presences";
import { getParticipants } from "@/lib/queries-admin";

const STATUTS = {
  a_valider: "À valider",
  confirme: "Inscrit",
  present: "Présent",
  absent: "Absent",
};

/** Liste d'accueil d'un événement au format tableur. */
export async function GET(
  _requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Le proxy garde déjà /admin ; l'export le redit pour lui-même.
  await exigerEquipe();
  const { id } = await params;
  // Un export après l'événement doit déjà compter les absents.
  await marquerAbsentsPasses(id);
  const participants = await getParticipants(id);
  const csv = versCsv(
    ["Nom", "Entreprise", "E-mail", "Statut"],
    participants.map((p) => [p.nom, p.entreprise, p.email, STATUTS[p.statut]]),
  );
  return reponseCsv(`participants-${id}`, csv);
}
