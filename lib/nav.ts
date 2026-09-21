import type { Space } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  /** Clé d'icône, résolue côté client dans components/nav-icons.tsx */
  icon: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_MEMBRE: NavGroup[] = [
  {
    label: "Espace membre",
    items: [
      { href: "/membre", label: "Vue d’ensemble", icon: "home" },
      { href: "/membre/annuaire", label: "Annuaire", icon: "users" },
      { href: "/membre/evenements", label: "Événements", icon: "calendar" },
      { href: "/membre/agenda", label: "Agenda", icon: "agenda" },
      { href: "/membre/actualites", label: "Actualités", icon: "news" },
      { href: "/membre/messagerie", label: "Messagerie", icon: "chat" },
      { href: "/membre/ressources", label: "Ressources", icon: "folder" },
      {
        href: "/membre/offres-cancham",
        label: "Services CanCham",
        icon: "briefcase",
      },
    ],
  },
  {
    label: "",
    items: [
      { href: "/membre/profil", label: "Mon entreprise", icon: "building" },
      {
        href: "/membre/cotisations",
        label: "Cotisations & factures",
        icon: "card",
      },
    ],
  },
  {
    label: "",
    items: [
      {
        href: "/membre/aide",
        label: "Besoin d’aide ?",
        icon: "help",
      },
      {
        href: "/membre/contact",
        label: "Contacter l’équipe",
        icon: "support",
      },
    ],
  },
];

export const NAV_ADMIN: NavGroup[] = [
  {
    label: "Pilotage",
    items: [
      { href: "/admin", label: "Tableau de bord", icon: "gauge" },
      { href: "/admin/journal", label: "Journal d’activité", icon: "history" },
      { href: "/admin/equipe", label: "Équipe & accès", icon: "shield" },
    ],
  },
  {
    label: "Adhérents",
    items: [
      { href: "/admin/membres", label: "Membres", icon: "users" },
      { href: "/admin/paiements", label: "Paiements & factures", icon: "card" },
    ],
  },
  {
    label: "Programme",
    items: [
      { href: "/admin/evenements", label: "Événements", icon: "calendar" },
      { href: "/admin/agenda", label: "Agenda", icon: "agenda" },
      { href: "/admin/actualites", label: "Actualités", icon: "news" },
      { href: "/admin/ressources", label: "Ressources", icon: "folder" },
      {
        href: "/admin/offres-cancham",
        label: "Services CanCham",
        icon: "briefcase",
      },
    ],
  },
  {
    label: "Échanges",
    items: [{ href: "/admin/messagerie", label: "Messagerie", icon: "chat" }],
  },
];

export function navFor(space: Space): NavGroup[] {
  return space === "admin" ? NAV_ADMIN : NAV_MEMBRE;
}

/** Fil d'Ariane et titre de la barre supérieure, par route. */
export const TITLES: Record<string, [string, string]> = {
  "/membre": ["Espace membre", "Vue d’ensemble"],
  "/membre/recherche": ["Espace membre", "Recherche"],
  "/membre/profil": ["Espace membre", "Mon entreprise"],
  "/membre/cotisations": ["Espace membre", "Cotisations & factures"],
  "/membre/offres-cancham": ["Espace membre", "Services CanCham"],
  "/membre/annuaire": ["Espace membre", "Annuaire"],
  "/membre/evenements": ["Espace membre", "Événements"],
  "/membre/agenda": ["Espace membre", "Agenda"],
  "/membre/actualites": ["Espace membre", "Actualités"],
  "/membre/messagerie": ["Espace membre", "Messagerie"],
  "/membre/ressources": ["Espace membre", "Ressources"],
  "/membre/contact": ["Espace membre", "Contacter l’équipe"],
  "/membre/aide": ["Espace membre", "Besoin d’aide ?"],
  "/admin": ["Back-office", "Tableau de bord"],
  "/admin/recherche": ["Back-office", "Recherche"],
  "/admin/journal": ["Back-office", "Journal d’activité"],
  "/admin/equipe": ["Back-office", "Équipe & accès"],
  "/admin/profil": ["Back-office", "Mon profil"],
  "/admin/membres": ["Back-office", "Membres"],
  "/admin/evenements": ["Back-office", "Événements"],
  "/admin/agenda": ["Back-office", "Agenda"],
  "/admin/paiements": ["Back-office", "Paiements & factures"],
  "/admin/offres-cancham": ["Back-office", "Services CanCham"],
  "/admin/messagerie": ["Back-office", "Messagerie"],
  "/admin/actualites": ["Back-office", "Actualités"],
  "/admin/ressources": ["Back-office", "Ressources"],
};

/**
 * Titre d'une route, y compris pour une page de détail : `/admin/membres/m1`
 * prend celui de `/admin/membres`. La clé la plus longue qui préfixe le chemin
 * l'emporte.
 */
export function titrePour(
  chemin: string,
  defaut: [string, string],
): [string, string] {
  if (TITLES[chemin]) return TITLES[chemin];
  const cle = Object.keys(TITLES)
    .filter((k) => chemin.startsWith(`${k}/`))
    .sort((a, b) => b.length - a.length)[0];
  return cle ? TITLES[cle] : defaut;
}
