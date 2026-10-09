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

export async function GET(
  _requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await exigerEquipe();
  const { id } = await params;
  await marquerAbsentsPasses(id);
  const participants = await getParticipants(id);
  const csv = versCsv(
    ["Nom", "Entreprise", "E-mail", "Statut"],
    participants.map((p) => [p.nom, p.entreprise, p.email, STATUTS[p.statut]]),
  );
  return reponseCsv(`participants-${id}`, csv);
}
