/**
 * Lecture humaine du journal des opérations.
 *
 * Le journal stocke des codes (`paiement_enregistre`) : c'est ce qui se
 * filtre et se compte. Ce module les traduit pour l'équipe et dit où mène
 * chaque entrée. Sans dépendance serveur : les pages et les composants
 * client s'en servent pareillement.
 */

export type FamilleJournal = "adhesion" | "finance" | "programme" | "contenu";

export interface ActionJournal {
  libelle: string;
  famille: FamilleJournal;
  /** Ton de la pastille : ce qui rapporte, ce qui retire, ce qui informe. */
  ton: "ok" | "bad" | "info";
}

export const ACTIONS_JOURNAL: Record<string, ActionJournal> = {
  candidature_deposee: {
    libelle: "Demande d’adhésion déposée",
    famille: "adhesion",
    ton: "info",
  },
  candidature_approuvee: {
    libelle: "Demande approuvée",
    famille: "adhesion",
    ton: "ok",
  },
  candidature_refusee: {
    libelle: "Demande refusée",
    famille: "adhesion",
    ton: "bad",
  },
  membre_cree: { libelle: "Membre ajouté", famille: "adhesion", ton: "ok" },
  membre_supprime: {
    libelle: "Membre supprimé",
    famille: "adhesion",
    ton: "bad",
  },
  membre_renomme: {
    libelle: "Entreprise renommée",
    famille: "adhesion",
    ton: "info",
  },
  contact_ajoute: {
    libelle: "Contact ajouté",
    famille: "adhesion",
    ton: "info",
  },
  contact_retire: {
    libelle: "Contact retiré",
    famille: "adhesion",
    ton: "bad",
  },
  paiement_enregistre: {
    libelle: "Paiement enregistré",
    famille: "finance",
    ton: "ok",
  },
  facture_emise: {
    libelle: "Facture émise",
    famille: "finance",
    ton: "info",
  },
  facture_payee: {
    libelle: "Facture marquée payée",
    famille: "finance",
    ton: "ok",
  },
  relance_envoyee: {
    libelle: "Relance de cotisation",
    famille: "finance",
    ton: "info",
  },
  ressource_achetee: {
    libelle: "Demande d’achat de ressource",
    famille: "finance",
    ton: "info",
  },
  // Code historique : c'était « Réserver et payer », devenu « Payer ».
  service_reserve: {
    libelle: "Demande de paiement d’un service",
    famille: "finance",
    ton: "info",
  },
  acces_active: {
    libelle: "Accès activé",
    famille: "adhesion",
    ton: "ok",
  },
  mot_de_passe_reinitialise: {
    libelle: "Mot de passe réinitialisé",
    famille: "adhesion",
    ton: "info",
  },
  equipe_ajoutee: {
    libelle: "Compte d’équipe créé",
    famille: "adhesion",
    ton: "ok",
  },
  mot_de_passe_modifie: {
    libelle: "Mot de passe modifié",
    famille: "adhesion",
    ton: "info",
  },
  admin_promu: {
    libelle: "Accès administrateur accordé",
    famille: "adhesion",
    ton: "ok",
  },
  admin_retire: {
    libelle: "Accès administrateur retiré",
    famille: "adhesion",
    ton: "bad",
  },
  service_gratuit_reserve: {
    libelle: "Réservation d’un service gratuit",
    famille: "programme",
    ton: "info",
  },
  evenement_cree: {
    libelle: "Événement créé",
    famille: "programme",
    ton: "ok",
  },
  evenement_modifie: {
    libelle: "Événement modifié",
    famille: "programme",
    ton: "info",
  },
  evenement_supprime: {
    libelle: "Événement supprimé",
    famille: "programme",
    ton: "bad",
  },
  actualite_publiee: {
    libelle: "Actualité publiée",
    famille: "contenu",
    ton: "ok",
  },
  actualite_modifiee: {
    libelle: "Actualité modifiée",
    famille: "contenu",
    ton: "info",
  },
  actualite_supprimee: {
    libelle: "Actualité supprimée",
    famille: "contenu",
    ton: "bad",
  },
  commentaire_supprime: {
    libelle: "Commentaire retiré",
    famille: "contenu",
    ton: "bad",
  },
  ressource_ajoutee: {
    libelle: "Ressource ajoutée",
    famille: "contenu",
    ton: "ok",
  },
  ressource_modifiee: {
    libelle: "Ressource modifiée",
    famille: "contenu",
    ton: "info",
  },
  ressource_supprimee: {
    libelle: "Ressource supprimée",
    famille: "contenu",
    ton: "bad",
  },
  service_ajoute: {
    libelle: "Service CanCham ajouté",
    famille: "contenu",
    ton: "ok",
  },
  service_modifie: {
    libelle: "Service CanCham modifié",
    famille: "contenu",
    ton: "info",
  },
  service_supprime: {
    libelle: "Service CanCham retiré",
    famille: "contenu",
    ton: "bad",
  },
  seed: {
    libelle: "Chargement des données",
    famille: "contenu",
    ton: "info",
  },
};

export const FAMILLES_JOURNAL: Record<FamilleJournal, string> = {
  adhesion: "Adhésions",
  finance: "Paiements",
  programme: "Événements",
  contenu: "Contenus",
};

export function actionJournal(code: string): ActionJournal {
  return (
    ACTIONS_JOURNAL[code] ?? {
      libelle: code.replace(/_/g, " "),
      famille: "contenu",
      ton: "info",
    }
  );
}

/** Codes d'une famille, pour filtrer le journal. */
export function codesDeFamille(famille: FamilleJournal): string[] {
  return Object.entries(ACTIONS_JOURNAL)
    .filter(([, a]) => a.famille === famille)
    .map(([code]) => code);
}

/**
 * Où mène une entrée. Une entité supprimée n'a plus de page : on renvoie
 * alors `null`, plutôt qu'un lien vers une erreur.
 */
export function lienJournal(
  action: string,
  entite: string,
  entiteId: string,
): string | null {
  if (/supprime|refusee/.test(action)) return null;
  switch (entite) {
    case "Member":
      return `/admin/membres/${entiteId}`;
    case "Invoice":
      return `/admin/paiements?q=${encodeURIComponent(entiteId)}`;
    case "Event":
      return `/admin/evenements/${entiteId}`;
    case "News":
      return `/admin/actualites/${entiteId}`;
    case "Resource":
      return "/admin/ressources";
    case "CanchamService":
      return "/admin/offres-cancham";
    case "MessageThread":
      return `/admin/messagerie?t=${entiteId}`;
    case "User":
      return "/admin/equipe";
    default:
      return null;
  }
}
