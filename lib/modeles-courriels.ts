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

export function courrielBienvenue(
  a: string,
  nom: string,
  lien: string,
): Courriel {
  return {
    a,
    sujet: "Bienvenue sur CanCham Connect",
    ...gabarit({
      titre: "Bienvenue sur CanCham Connect",
      paragraphes: [
        `Bonjour ${prenom(nom)},`,
        "Votre compte est créé et votre demande d’adhésion est enregistrée. Prochaine étape : présentez-vous et présentez votre entreprise, en quelques minutes.",
        "L’équipe CanCham examine ensuite votre demande ; votre espace s’ouvre entièrement dès la cotisation réglée.",
      ],
      bouton: { libelle: "Compléter mon inscription", url: lien },
    }),
  };
}

export function courrielNouvelleInscription(
  a: string,
  email: string,
  motivation: string,
  lien: string,
): Courriel {
  return {
    a,
    sujet: `Nouvelle inscription : ${email}`,
    ...gabarit({
      titre: "Nouvelle inscription sur CanCham Connect",
      paragraphes: [
        `${email} vient de créer un compte.`,
        `Sa motivation : « ${motivation} »`,
        "S’il s’agit d’un collaborateur de la chambre, promouvez-le depuis « Équipe & accès » ; sinon, sa demande d’adhésion vous attend.",
      ],
      bouton: { libelle: "Voir les inscriptions", url: lien },
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
    sujet: "Votre demande d’adhésion est approuvée",
    ...gabarit({
      titre: "Votre demande d’adhésion est approuvée",
      paragraphes: [
        `Bonjour ${prenom(d.nom)},`,
        `L’équipe CanCham a approuvé la demande d’adhésion de ${d.entreprise}. Bienvenue dans la chambre !`,
        `Dernière étape : le règlement de la cotisation annuelle (${d.formule}, ${d.montant}), auprès de l’équipe, en espèces, par virement ou par chèque. Votre espace s’ouvre entièrement dès qu’il est enregistré.`,
      ],
      bouton: { libelle: "Voir ma cotisation", url: d.lien },
    }),
  };
}
