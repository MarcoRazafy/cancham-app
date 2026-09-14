import type { CanchamEvent, Registration } from "../../lib/types";

/**
 * Événements d'exemple. Le jeu couvre à la fois des dates passées et à venir
 * par rapport à septembre 2026, pour que les onglets « À venir » / « Passés »
 * soient tous les deux peuplés.
 */
export const EVENTS: CanchamEvent[] = [
  {
    id: "e1",
    titre: "5 à 7 Réseautage",
    date: "2026-09-22",
    lieu: "Antananarivo",
    format: "Présentiel",
    cap: 80,
    inscrits: 52,
    payant: false,
    prix: 0,
    photo:
      "https://images.pexels.com/photos/18999582/pexels-photo-18999582.jpeg?auto=compress&cs=tinysrgb&w=1200",
    desc: "Rendez-vous régulier de réseautage entre membres, dans une formule courte et conviviale en fin de journée.",
  },
  {
    id: "e2",
    titre: "Lancement officiel — MECC 9ᵉ édition",
    date: "2026-10-01",
    lieu: "Antananarivo",
    format: "Présentiel",
    cap: 120,
    inscrits: 64,
    payant: false,
    prix: 0,
    photo:
      "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=1200&q=80&auto=format&fit=crop",
    desc: "Ouverture officielle de la 9ᵉ Mission Économique et Commerciale au Canada, volet Tourisme et Éducation.",
  },
  {
    id: "e3",
    titre: "Canada Expo — Caravane de régionalisation",
    date: "2026-10-09",
    lieu: "Tamatave",
    format: "Présentiel",
    cap: 150,
    inscrits: 71,
    payant: false,
    prix: 0,
    photo:
      "https://images.unsplash.com/photo-1590496793907-4d66e2994b4d?w=1200&q=80&auto=format&fit=crop",
    desc: "Étape régionale de la caravane Canada Expo, à destination des entreprises de la côte Est.",
  },
  {
    id: "e4",
    titre: "Atelier en ligne — Mobilité francophone",
    date: "2026-10-15",
    lieu: "En ligne",
    format: "Webinaire",
    cap: 200,
    inscrits: 96,
    payant: false,
    prix: 0,
    photo:
      "https://images.pexels.com/photos/4226256/pexels-photo-4226256.jpeg?auto=compress&cs=tinysrgb&w=1200",
    desc: "Séance pratique sur les programmes de mobilité francophone vers le Canada, animée avec nos partenaires institutionnels.",
  },
  {
    id: "e5",
    titre: "5 à 7 Réseautage",
    date: "2026-11-27",
    lieu: "Antananarivo",
    format: "Présentiel",
    cap: 80,
    inscrits: 18,
    payant: false,
    prix: 0,
    photo:
      "https://images.pexels.com/photos/8761647/pexels-photo-8761647.jpeg?auto=compress&cs=tinysrgb&w=1200",
    desc: "Rendez-vous régulier de réseautage entre membres, dans une formule courte et conviviale en fin de journée.",
  },
  {
    id: "e6",
    titre: "Canada Expo — Caravane de régionalisation",
    date: "2026-12-03",
    lieu: "SAVA",
    format: "Présentiel",
    cap: 100,
    inscrits: 9,
    payant: false,
    prix: 0,
    photo:
      "https://images.pexels.com/photos/17309031/pexels-photo-17309031.jpeg?auto=compress&cs=tinysrgb&w=1200",
    desc: "Étape régionale de la caravane Canada Expo dans la région SAVA, axée vanille et épices.",
  },
  {
    id: "e7",
    titre: "Gala des 10 ans CanCham + Restitution MECC 8",
    date: "2026-07-27",
    lieu: "Antananarivo — Radisson Blu",
    format: "Présentiel",
    cap: 220,
    inscrits: 214,
    payant: true,
    prix: 150000,
    photo:
      "https://images.pexels.com/photos/38446275/pexels-photo-38446275.jpeg?auto=compress&cs=tinysrgb&w=1200",
    desc: "Événement combiné célébrant les 10 ans de la chambre et restituant les résultats de la MECC 8.",
  },
  {
    id: "e8",
    titre: "Canada Expo Antananarivo",
    date: "2026-06-30",
    lieu: "Antananarivo",
    format: "Présentiel",
    cap: 150,
    inscrits: 150,
    payant: false,
    prix: 0,
    photo:
      "https://images.pexels.com/photos/35138560/pexels-photo-35138560.jpeg?auto=compress&cs=tinysrgb&w=1200",
    desc: "Étape capitale de la caravane Canada Expo 2026.",
  },
  {
    id: "e9",
    titre: "5 à 7 Réseautage",
    date: "2026-08-28",
    lieu: "Antananarivo",
    format: "Présentiel",
    cap: 80,
    inscrits: 74,
    payant: false,
    prix: 0,
    photo:
      "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1200&q=80&auto=format&fit=crop",
    desc: "Rendez-vous régulier de réseautage entre membres.",
  },
];

export function findEvent(id: string): CanchamEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}

/**
 * Inscriptions du membre de démonstration (m1).
 *
 * Dans le prototype, `REGISTRATIONS` était une variable globale non rattachée
 * au membre : changer d'entreprise conservait ses inscriptions. Ici chaque
 * inscription porte son `memberId`.
 */
export const REGISTRATIONS: Registration[] = [
  { eventId: "e2", memberId: "m1", code: "CC-E2-4718", date: "2026-09-04" },
  { eventId: "e4", memberId: "m1", code: "CC-E4-2093", date: "2026-09-07" },
  { eventId: "e7", memberId: "m1", code: "CC-E7-8845", date: "2026-07-12" },
];

export function registrationFor(
  eventId: string,
  memberId: string | null,
): Registration | undefined {
  if (!memberId) return undefined;
  return REGISTRATIONS.find((r) => r.eventId === eventId && r.memberId === memberId);
}
