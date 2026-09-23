import "server-only";

import { gabarit, type Courriel } from "@/lib/courriel";
import { pngQr } from "@/lib/qr";

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
        "Dès qu’elle sera validée, vous recevrez un e-mail avec un lien pour créer votre mot de passe. Vous pourrez alors vous connecter à CanCham Connect et compléter votre fiche : logo, couverture, produits et services.",
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
    /**
     * Vrai quand la personne n'a pas encore de mot de passe : le lien mène à
     * sa création, valable sept jours. Faux : il mène à la connexion.
     */
    creerMotDePasse: boolean;
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
        d.creerMotDePasse
          ? "Créez votre mot de passe pour vous connecter à CanCham Connect : quelques étapes vous permettent ensuite de compléter votre fiche — activité, logo, couverture, produits et services."
          : "Connectez-vous dès maintenant avec votre adresse et votre mot de passe : quelques étapes vous permettent de compléter votre fiche — activité, logo, couverture, produits et services.",
        `Votre espace s’ouvre ensuite entièrement dès le règlement de la cotisation annuelle (${d.formule}, ${d.montant}), auprès de l’équipe, en espèces, par virement ou par chèque.`,
      ],
      bouton: {
        libelle: d.creerMotDePasse ? "Créer mon mot de passe" : "Me connecter",
        url: d.lien,
      },
      apres: d.creerMotDePasse
        ? [
            "Ce lien est valable sept jours. Passé ce délai, utilisez « Mot de passe oublié ? » sur la page de connexion.",
          ]
        : [],
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

/** Ce qu'un e-mail dit d'un événement : de quoi s'y rendre sans rien chercher. */
interface Rendezvous {
  evenement: string;
  /** Date et horaire, déjà mis en forme : « mardi 6 octobre 2026 · 17 h 30 – 20 h 00 ». */
  quand: string;
  lieu: string;
  /** Les personnes inscrites, chacune avec son code d'accueil. */
  participants: { nom: string; code: string }[];
  /** Page où retrouver l'inscription : billets publics, ou fiche de l'événement. */
  lien: string;
}

/**
 * Les billets d'une inscription : un QR code par personne, joint au message.
 *
 * Il part dès l'inscription quand l'événement est gratuit, et seulement après
 * validation du règlement quand il est payant. Le code est aussi écrit en
 * clair : une messagerie qui n'affiche pas les images laisse quand même de
 * quoi être accueilli.
 */
export async function courrielBilletsEvenement(
  a: string,
  d: Rendezvous,
): Promise<Courriel> {
  const plusieurs = d.participants.length > 1;
  const pieces = await Promise.all(
    d.participants.map(async (p) => ({
      nom: `billet-${p.code}.png`,
      contenu: await pngQr(p.code),
      type: "image/png",
      cid: `qr-${p.code}`,
    })),
  );
  return {
    a,
    sujet: `Votre billet — ${d.evenement}`,
    pieces,
    ...gabarit({
      titre: "Votre inscription est confirmée",
      paragraphes: [
        "Bonjour,",
        `Votre inscription à « ${d.evenement} » est confirmée.`,
        `Quand : ${d.quand}`,
        `Où : ${d.lieu}`,
        plusieurs
          ? `${d.participants.length} participants, chacun avec son QR code :`
          : "Votre QR code d’entrée :",
      ],
      images: d.participants.map((p) => ({
        cid: `qr-${p.code}`,
        legende: `${p.nom ? `${p.nom} — ` : ""}${p.code}`,
      })),
      bouton: {
        libelle: plusieurs ? "Voir les billets" : "Voir mon billet",
        url: d.lien,
      },
      apres: [
        `Présentez ${plusieurs ? "chacun son" : "votre"} QR code à l’accueil : il suffit de le montrer sur un téléphone, ou imprimé. Le code écrit sous l’image fait foi si le QR ne se lit pas.`,
        "Gardez cet e-mail. Pour toute question, répondez simplement à ce message.",
      ],
    }),
  };
}

/**
 * Inscription à un événement payant : elle est enregistrée, elle attend le
 * règlement. Le QR code ne part qu'ensuite — c'est dit ici, pour que
 * personne ne se présente à l'accueil sans billet.
 */
export function courrielInscriptionEnAttente(
  a: string,
  d: Omit<Rendezvous, "participants"> & {
    participants: { nom: string }[];
    /** Montant total à régler, déjà mis en forme. */
    aRegler: string;
  },
): Courriel {
  const plusieurs = d.participants.length > 1;
  return {
    a,
    sujet: `Inscription enregistrée, en attente de validation — ${d.evenement}`,
    ...gabarit({
      titre: "Votre inscription attend d’être validée",
      paragraphes: [
        "Bonjour,",
        `Votre inscription à « ${d.evenement} » est enregistrée. L’événement étant payant, elle attend la validation de l’équipe CanCham.`,
        `Quand : ${d.quand}`,
        `Où : ${d.lieu}`,
        plusieurs
          ? `Inscrits : ${d.participants.map((p) => p.nom).join(", ")}`
          : `Inscrit : ${d.participants[0]?.nom ?? ""}`,
        `À régler : ${d.aRegler}, auprès de l’équipe CanCham — en espèces, par virement bancaire ou par chèque.`,
        `Dès que le règlement est constaté, vous recevez un second e-mail avec ${plusieurs ? "les QR codes d’entrée" : "votre QR code d’entrée"}. C’est lui qui vous ouvre l’accueil : sans lui, l’entrée n’est pas assurée.`,
      ],
      bouton: { libelle: "Voir mon inscription", url: d.lien },
      apres: [
        "Si vous avez déjà réglé, ne tenez pas compte de ce rappel : l’enregistrement peut prendre quelques heures. Pour toute question, répondez simplement à ce message.",
      ],
    }),
  };
}
