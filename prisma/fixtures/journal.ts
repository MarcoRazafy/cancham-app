import { fmtMontant } from "../../lib/membership";
import { INVOICES } from "./invoices";

/**
 * Historique de démonstration du journal des opérations.
 *
 * Tiré des données elles-mêmes — chaque facture payée a son encaissement, la
 * candidature en cours son dépôt, le membre en retard sa relance — pour que
 * le journal raconte la même histoire que les fiches.
 */

export interface EntreeJournalDemo {
  action: string;
  entite: string;
  entiteId: string;
  acteur: string;
  detail: string;
  createdAt: Date;
}

const EQUIPE = "Ando Ratovomanana";

/** Une date à une heure de bureau plausible, pour que les heures varient. */
const le = (iso: string, heure: string) => new Date(`${iso}T${heure}:00`);

export function journalDemo(aujourdhui: Date): EntreeJournalDemo[] {
  const ilYa = (jours: number, heure: string) => {
    const d = new Date(aujourdhui);
    d.setDate(d.getDate() - jours);
    const [h, m] = heure.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const modes = ["virement", "Mobile Money", "chèque", "espèces"];

  const paiements = INVOICES.filter((f) => f.statut === "payee").map(
    (f, i): EntreeJournalDemo => ({
      action: "paiement_enregistre",
      entite: "Invoice",
      entiteId: f.numero,
      acteur: EQUIPE,
      detail: `${fmtMontant(f.montant, f.devise)} par ${modes[i % modes.length]} pour ${f.membre}.`,
      createdAt: le(
        f.date,
        `${9 + (i % 7)}:${String((i * 17) % 60).padStart(2, "0")}`,
      ),
    }),
  );

  return [
    ...paiements,
    {
      action: "candidature_approuvee",
      entite: "Member",
      entiteId: "m4",
      acteur: EQUIPE,
      detail: "Sahanala Agro · en attente du paiement de la cotisation.",
      createdAt: le("2026-06-01", "15:20"),
    },
    {
      action: "relance_envoyee",
      entite: "Member",
      entiteId: "m8",
      acteur: EQUIPE,
      detail: "Relance de cotisation pour Institut Vola Formation.",
      createdAt: le("2026-07-15", "10:05"),
    },
    {
      action: "actualite_publiee",
      entite: "News",
      entiteId: "n1",
      acteur: EQUIPE,
      detail:
        "« Lancement de la 9ᵉ édition de la MECC : cap sur le tourisme et l’éducation »",
      createdAt: le("2026-09-02", "08:45"),
    },
    {
      action: "candidature_deposee",
      entite: "Member",
      entiteId: "m10",
      acteur: "Formulaire d’adhésion",
      detail: "Demande de Zafy Design · Madagascar — Entreprise.",
      createdAt: le("2026-09-05", "21:12"),
    },
    {
      action: "relance_envoyee",
      entite: "Member",
      entiteId: "m8",
      acteur: EQUIPE,
      detail: "Deuxième relance pour Institut Vola Formation · accès bloqué.",
      createdAt: ilYa(6, "09:40"),
    },
    {
      action: "contact_ajoute",
      entite: "Member",
      entiteId: "m2",
      acteur: "Highlands Artisanat",
      detail:
        "Fanomezantsoa Randria ajouté aux contacts de Highlands Artisanat.",
      createdAt: ilYa(4, "14:30"),
    },
    {
      action: "ressource_achetee",
      entite: "Resource",
      entiteId: "r1",
      acteur: "Voninkazo Andriamampianina",
      detail: "Guide pratique — Doing Business in Canada",
      createdAt: ilYa(1, "16:55"),
    },
    {
      action: "ressource_achetee",
      entite: "Resource",
      entiteId: "r6",
      acteur: "Mialy Razanadrakoto",
      detail: "Formation — Structurer sa démarche export vers le Canada",
      createdAt: ilYa(0, "09:10"),
    },
  ].filter((e) => e.createdAt <= aujourdhui);
}
