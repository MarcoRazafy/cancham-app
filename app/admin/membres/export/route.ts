import { reponseCsv, versCsv } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { lireFiltres, filtrerMembres } from "@/lib/filtres-membres";
import { statusLabel } from "@/lib/format";
import { fmtCotisation, joursDeRetard, libelleFormule } from "@/lib/membership";
import { getMembers } from "@/lib/queries";

/** Liste des membres au format tableur, avec les filtres de la page. */
export async function GET(requete: Request) {
  const params = Object.fromEntries(new URL(requete.url).searchParams);
  const membres = filtrerMembres(await getMembers(), lireFiltres(params));

  const referents = new Map(
    (
      await prisma.user.findMany({
        where: {
          memberId: { in: membres.map((m) => m.id) },
          contactPrincipal: true,
        },
        select: { memberId: true, nom: true, email: true, tel: true },
      })
    ).map((u) => [u.memberId, u]),
  );

  const csv = versCsv(
    [
      "Membre",
      "Type",
      "Secteur",
      "Ville",
      "Pays",
      "Formule",
      "Cotisation annuelle",
      "Statut",
      "Jours de retard",
      "Membre depuis",
      "Contact principal",
      "E-mail",
      "Téléphone",
      "Site web",
    ],
    membres.map((m) => {
      const r = referents.get(m.id);
      return [
        m.nom,
        m.type === "physique" ? "Indépendant" : "Entreprise",
        m.secteur,
        m.ville,
        m.pays,
        libelleFormule(m.formule),
        fmtCotisation(m.formule),
        statusLabel(m.statut),
        m.statut === "en_retard" ? joursDeRetard(m) : "",
        m.adhesion,
        r?.nom,
        r?.email,
        r?.tel,
        m.siteweb,
      ];
    }),
  );

  return reponseCsv("membres-cancham", csv);
}
