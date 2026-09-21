import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import {
  CadreAuth,
  ChampAuth,
  ChampMotDePasse,
  CHAMP_AUTH,
  Saisie,
} from "@/components/public/CadreAuth";
import { BoutonEnvoi, EcranPassage } from "@/components/public/BoutonMarque";
import { Saillant } from "@/components/ui";
import { MOT_DE_PASSE_MIN } from "@/lib/auth";
import { creerCompte } from "@/lib/actions/accueil";
import { utilisateurConnecte } from "@/lib/session";

/**
 * Inscription : l'essentiel seulement — courriel, mot de passe, motivation.
 *
 * On s'inscrit en une minute. La session s'ouvre aussitôt, et la suite de la
 * fiche d'inscription de la chambre — qui l'on est, l'entreprise, la
 * formule, l'activité — se complète étape par étape sur `/bienvenue`.
 */
export default async function InscriptionPage() {
  const connecte = await utilisateurConnecte();
  if (connecte) redirect(connecte.role === "admin" ? "/admin" : "/membre");

  return (
    <CadreAuth
      photo="/photos/auth-rencontre.jpg"
      alt="Membres et partenaires réunis lors d’une rencontre CanCham"
      accroche={
        <>
          Votre prochain <Saillant>partenariat</Saillant> commence{" "}
          <Saillant ton="vert">ici</Saillant>.
        </>
      }
      sous="Inscrivez-vous en une minute : vous présenterez votre entreprise ensuite, étape par étape, à votre rythme."
    >
      <span className="surtitre text-marque-vert">Demande d’adhésion</span>
      <h1 className="titre text-[clamp(26px,3.4vw,34px)] m-0 mt-2.5 mb-2">
        Créer mon compte
      </h1>
      <p className="text-[14.5px] text-muted m-0 mb-7">
        Quelques secondes suffisent. Vous présenterez ensuite votre entreprise,
        étape par étape ; l’accès complet s’ouvre après validation par l’équipe
        et règlement de la cotisation.
      </p>

      <form action={creerCompte} className="flex flex-col gap-3.5">
        <Field label="Adresse courriel" icone={<Mail size={16} />}>
          <Saisie
            avecIcone
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="vous@entreprise.mg"
          />
        </Field>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <ChampMotDePasse
            label="Mot de passe"
            hint={`${MOT_DE_PASSE_MIN} caractères au moins.`}
            icone={<Lock size={16} />}
            name="motDePasse"
            required
            minLength={MOT_DE_PASSE_MIN}
            autoComplete="new-password"
            placeholder="••••••••"
          />
          <ChampMotDePasse
            label="Confirmation"
            icone={<Lock size={16} />}
            name="confirmation"
            required
            minLength={MOT_DE_PASSE_MIN}
            autoComplete="new-password"
            placeholder="••••••••"
          />
        </div>

        <Field label="Motivation à rejoindre CanCham">
          <textarea
            name="motivation"
            required
            rows={4}
            placeholder="Ce que vous attendez de la chambre : contacts au Canada, événements, accompagnement…"
            className={`${CHAMP_AUTH} px-3.5`}
          />
        </Field>

        <div className="mt-3">
          <BoutonEnvoi enCours="Création du compte…">
            Créer mon compte
          </BoutonEnvoi>
          <EcranPassage
            message="Création de votre compte…"
            detail="Vous allez pouvoir présenter votre entreprise."
          />
        </div>
      </form>

      <p className="text-[13.5px] text-muted mt-6 mb-0">
        Déjà un compte ?{" "}
        <Link
          href="/public"
          className="text-marque-vert font-semibold no-underline hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </CadreAuth>
  );
}

const Field = ChampAuth;
