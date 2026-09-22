import "server-only";

import { gabarit, type Courriel } from "@/lib/courriel";

/**
 * Les e-mails de la plateforme, un par situation. Chacun dit pourquoi il
 * arrive, ce qu'il faut faire, et ce qui se passe si l'on ne fait rien.
 */

const prenom = (nom: string) => nom.split(" ")[0] || nom;

export function courrielReinitialisation(
  a: string,
  nom: string,
  lien: string,
): Courriel {
  return {
    a,
    sujet: "Réinitialiser votre mot de passe CanCham Connect",
    ...gabarit({
      titre: "Réinitialiser votre mot de passe",
      paragraphes: [
        `Bonjour ${prenom(nom)},`,
        "Vous avez demandé à changer le mot de passe de votre compte CanCham Connect. Ce lien est valable une heure et ne sert qu’une fois.",
      ],
      bouton: { libelle: "Choisir un nouveau mot de passe", url: lien },
      apres: [
        "Si vous n’êtes pas à l’origine de cette demande, ignorez ce message : votre mot de passe actuel reste valable.",
      ],
    }),
  };
}

export function courrielInvitation(
  a: string,
  nom: string,
  entreprise: string | null,
  lien: string,
): Courriel {
  return {
    a,
    sujet: "Votre accès à CanCham Connect",
    ...gabarit({
      titre: "Votre accès à CanCham Connect",
      paragraphes: [
        `Bonjour ${prenom(nom)},`,
        `Un accès à CanCham Connect, la plateforme des membres de la Chambre de Commerce et de Coopération Canada–Madagascar, a été ouvert à votre nom${
          entreprise ? ` pour ${entreprise}` : ""
        }.`,
        "Choisissez votre mot de passe pour vous connecter : annuaire des membres, événements, messagerie et ressources vous attendent.",
      ],
      bouton: { libelle: "Choisir mon mot de passe", url: lien },
      apres: [
        "Ce lien est valable sept jours. Passé ce délai, utilisez « Mot de passe oublié ? » sur la page de connexion.",
      ],
    }),
  };
}

export function courrielDemandeRecue(a: string, nom: string): Courriel {
  return {
    a,
    sujet: "Votre demande d’adhésion à CanCham est bien reçue",
    ...gabarit({
      titre: "Votre demande d’adhésion est bien reçue",
      paragraphes: [
        `Bonjour ${prenom(nom)},`,
        "Merci de votre intérêt pour la Chambre de Commerce et de Coopération Canada–Madagascar. Votre demande d’adhésion est enregistrée, et l’équipe CanCham l’examine.",
        "Vous recevrez un e-mail dès qu’elle sera validée. Vous pourrez alors vous connecter à CanCham Connect et compléter votre fiche : logo, couverture, produits et services.",
      ],
    }),
  };
}

export function courrielNouvelleInscription(
  a: string,
  email: string,
  /** Ce que la personne a dit d'elle : fonction, téléphone, motivation… */
  precisions: (string | null)[],
  lien: string,
): Courriel {
  return {
    a,
    sujet: `Nouvelle demande d’adhésion : ${email}`,
    ...gabarit({
      titre: "Nouvelle demande d’adhésion",
      paragraphes: [
        `${email} vient de déposer une demande d’adhésion. Sa connexion reste fermée tant que vous ne l’avez pas validée.`,
        ...precisions.filter((p): p is string => !!p),
        "S’il s’agit d’un collaborateur de la chambre, promouvez-le plutôt depuis « Équipe & accès ».",
      ],
      bouton: { libelle: "Examiner la demande", url: lien },
    }),
  };
}

export function courrielRelanceCotisation(
  a: string,
  d: {
    nom: string;
    entreprise: string;
    montant: string;
    formule: string;
    retardJours: number | null;
    lien: string;
  },
): Courriel {
  return {
    a,
    sujet: `Cotisation CanCham — ${d.entreprise}`,
    ...gabarit({
      titre: "Votre cotisation CanCham",
      paragraphes: [
        `Bonjour ${prenom(d.nom)},`,
        d.retardJours
          ? `La cotisation de ${d.entreprise} (${d.formule}, ${d.montant} par an) est en attente de règlement depuis ${d.retardJours} jour${d.retardJours > 1 ? "s" : ""}.`
          : `La cotisation de ${d.entreprise} (${d.formule}, ${d.montant} par an) est en attente de règlement.`,
        "Vous pouvez la régler auprès de l’équipe CanCham, en espèces, par virement ou par chèque. Votre espace membre indique votre situation et vos factures.",
      ],
      bouton: { libelle: "Voir mes cotisations", url: d.lien },
      apres: [
        "Si vous avez déjà réglé, merci de ne pas tenir compte de ce message : l’enregistrement peut prendre quelques jours.",
      ],
    }),
  };
}

export function courrielDemandeApprouvee(
  a: string,
  d: {
    nom: string;
    entreprise: string;
    montant: string;
    formule: string;
    lien: string;
  },
): Courriel {
  return {
    a,
    sujet: "Votre demande d’adhésion est validée",
    ...gabarit({
      titre: "Votre demande d’adhésion est validée",
      paragraphes: [
        `Bonjour ${prenom(d.nom)},`,
        `L’équipe CanCham a validé la demande d’adhésion de ${d.entreprise}. Bienvenue dans la chambre !`,
        "Connectez-vous dès maintenant avec l’adresse et le mot de passe choisis à l’inscription : quelques étapes vous permettent de compléter votre fiche — activité, logo, couverture, produits et services.",
        `Votre espace s’ouvre ensuite entièrement dès le règlement de la cotisation annuelle (${d.formule}, ${d.montant}), auprès de l’équipe, en espèces, par virement ou par chèque.`,
      ],
      bouton: { libelle: "Me connecter", url: d.lien },
    }),
  };
}

export function courrielCompteEquipe(
  a: string,
  d: { fonction: string; niveau: string; motDePasse: string; lien: string },
): Courriel {
  return {
    a,
    sujet: "Votre accès à l’équipe CanCham Connect",
    ...gabarit({
      titre: "Bienvenue dans l’équipe CanCham Connect",
      paragraphes: [
        "Bonjour,",
        `Un accès au back-office de CanCham Connect vient d’être ouvert pour vous, en tant que « ${d.fonction} », avec le niveau ${d.niveau}.`,
        `Votre identifiant : ${a}`,
        `Votre mot de passe provisoire : ${d.motDePasse}`,
        "Dès votre première connexion, ouvrez « Mon profil » pour indiquer votre nom et choisir votre propre mot de passe.",
      ],
      bouton: { libelle: "Me connecter", url: d.lien },
      apres: [
        "Si vous n’attendiez pas cet accès, ignorez ce message et prévenez l’équipe CanCham.",
      ],
    }),
  };
}
