"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hacher, MOT_DE_PASSE_MIN, ouvrirSession } from "@/lib/auth";
import { envoyerCourriel, urlPublique } from "@/lib/courriel";
import { redirectWithFlash } from "@/lib/flash";
import { creerJeton, jetonValide } from "@/lib/jetons";
import { minutes, origineAppelante, tentative } from "@/lib/limite";
import { courrielReinitialisation } from "@/lib/modeles-courriels";

/**
 * Mot de passe oublié, et premier mot de passe d'un compte invité.
 *
 * La demande répond toujours la même chose, que l'adresse ait un compte ou
 * non : sinon, le formulaire servirait à vérifier qui est inscrit. Pour la
 * même raison, la recherche du compte et l'envoi se font après la réponse.
 */

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

const OUBLI = "/public/mot-de-passe-oublie";
const NOUVEAU = "/public/nouveau-mot-de-passe";

/** Demandes tolérées par heure : sur une adresse, puis sur une origine. */
const DEMANDES_PAR_ADRESSE = 3;
const DEMANDES_PAR_ORIGINE = 10;
const HEURE = 60 * 60 * 1000;

function vers(chemin: string, params: Record<string, string>): never {
  redirect(`${chemin}?${new URLSearchParams(params)}`);
}

export async function demanderReinitialisation(formData: FormData) {
  const email = texte(formData, "email").toLowerCase();
  if (!email.includes("@")) {
    vers(OUBLI, { erreur: "Indiquez une adresse courriel valide.", email });
  }

  const origine = await origineAppelante();
  const attente = Math.max(
    tentative(`oubli:${email}`, DEMANDES_PAR_ADRESSE, HEURE),
    tentative(`oubli:${origine}`, DEMANDES_PAR_ORIGINE, HEURE),
  );
  if (attente) {
    vers(OUBLI, {
      erreur: `Trop de demandes. Réessayez dans ${minutes(attente)} minute${
        minutes(attente) > 1 ? "s" : ""
      }.`,
      email,
    });
  }

  const base = await urlPublique(NOUVEAU);
  after(async () => {
    const u = await prisma.user.findUnique({
      where: { email },
      select: { id: true, nom: true, role: true },
    });
    // Un compte retiré de la plateforme ne reçoit rien.
    if (!u || u.role === "visiteur") return;
    const jeton = await creerJeton(u.id, "reinitialisation");
    await envoyerCourriel(
      courrielReinitialisation(email, u.nom, `${base}?jeton=${jeton}`),
    );
  });

  vers(OUBLI, { envoye: email });
}

/** Choix du mot de passe, depuis le lien reçu par e-mail. */
export async function definirMotDePasse(formData: FormData) {
  const brut = texte(formData, "jeton");
  const motDePasse = String(formData.get("motDePasse") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  const jeton = await jetonValide(brut);
  if (!jeton) {
    vers(OUBLI, {
      erreur:
        "Ce lien n’est plus valable. Demandez-en un nouveau : il arrive en quelques secondes.",
    });
  }
  if (motDePasse.length < MOT_DE_PASSE_MIN) {
    vers(NOUVEAU, {
      jeton: brut,
      erreur: `Le mot de passe fait au moins ${MOT_DE_PASSE_MIN} caractères.`,
    });
  }
  if (motDePasse !== confirmation) {
    vers(NOUVEAU, {
      jeton: brut,
      erreur: "Les deux mots de passe ne correspondent pas.",
    });
  }

  const { user } = jeton;
  const invitation = jeton.usage === "invitation";
  await prisma.$transaction([
    // La date de changement ferme les sessions ouvertes avant elle : un
    // mot de passe changé parce qu'il avait fuité ne laisse personne dedans.
    prisma.user.update({
      where: { id: user.id },
      data: { motDePasse: hacher(motDePasse), motDePasseModifieLe: new Date() },
    }),
    prisma.jetonCompte.update({
      where: { id: jeton.id },
      data: { utiliseLe: new Date() },
    }),
    prisma.jetonCompte.deleteMany({
      where: { userId: user.id, utiliseLe: null },
    }),
    prisma.auditLog.create({
      data: {
        action: invitation ? "acces_active" : "mot_de_passe_reinitialise",
        // Le journal mène à la fiche de l'entreprise, ou à l'équipe.
        entite: user.memberId ? "Member" : "User",
        entiteId: user.memberId ?? user.id,
        acteur: user.nom,
        detail: invitation
          ? `${user.email} a choisi son mot de passe et activé son accès.`
          : `${user.email} a réinitialisé son mot de passe.`,
      },
    }),
  ]);

  await ouvrirSession(user.id);
  const message = invitation
    ? "Bienvenue ! Votre accès est activé"
    : "Mot de passe modifié";
  if (user.role === "admin") redirectWithFlash("/admin", message);
  if (user.member?.accueilEnCours) redirect("/bienvenue");
  redirectWithFlash("/membre", message);
}
