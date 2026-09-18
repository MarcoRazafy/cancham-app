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
import { BoutonEnvoi } from "@/components/public/BoutonMarque";
import { Saillant } from "@/components/ui";
import { ChoixFormule } from "@/components/public/ChoixFormule";
import { MOT_DE_PASSE_MIN } from "@/lib/auth";
import { submitAdhesion } from "@/lib/actions/members";
import { utilisateurConnecte } from "@/lib/session";

/**
 * Inscription : la demande d'adhésion, doublée de la création du compte.
 *
 * Les champs sont ceux de la fiche d'inscription de la chambre — l'équipe
 * retrouve dans le back-office exactement ce qu'elle a l'habitude de lire.
 * Le mot de passe s'y ajoute : la session s'ouvre dans la foulée, et le
 * candidat suit sa demande depuis son espace.
 */
export default async function InscriptionPage() {
  const connecte = await utilisateurConnecte();
  if (connecte) redirect(connecte.role === "admin" ? "/admin" : "/membre");

  return (
    <CadreAuth
      large
      photo="/photos/auth.jpg"
      alt="Entrepreneurs réunis autour de la table avec l’équipe CanCham"
      accroche={
        <>
          Votre prochain <Saillant>partenariat</Saillant> commence{" "}
          <Saillant ton="vert">ici</Saillant>.
        </>
      }
      sous="Présentez votre entreprise : l’équipe CanCham examine votre demande, et votre espace s’ouvre dès la cotisation réglée."
    >
      <span className="surtitre text-marque-vert">Demande d’adhésion</span>
      <h1 className="titre text-[clamp(26px,3.4vw,34px)] m-0 mt-2.5 mb-2">
        Créer mon compte
      </h1>
      <p className="text-[14.5px] text-muted m-0 mb-7">
        Votre profil est créé immédiatement. L’accès complet est activé après
        validation par l’équipe et règlement de la cotisation.
      </p>

      <form action={submitAdhesion} className="flex flex-col gap-3.5">
        <input type="hidden" name="retour" value="/public/inscription" />

        <Rubrique titre="Vos identifiants" premiere />
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

        <Rubrique titre="Votre formule" premiere />
        <Field label="Formule d’adhésion">
          <ChoixFormule id="adh-formule" className={INPUT} />
        </Field>

        <Field label="Type de membre">
          <select name="type" className={INPUT}>
            <option value="morale">Entreprise (personne morale)</option>
            <option value="physique">Indépendant (personne physique)</option>
          </select>
        </Field>

        <Rubrique titre="L’entreprise" />
        <Field label="Nom de l’entreprise">
          <input
            type="text"
            name="nom"
            required
            placeholder="Ex. Zafy Design"
            className={INPUT}
          />
        </Field>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Secteur d’activité">
            <input
              type="text"
              name="secteur"
              placeholder="Ex. Artisanat & design"
              className={INPUT}
            />
          </Field>
          <Field label="Ville">
            <input
              type="text"
              name="ville"
              placeholder="Antananarivo"
              className={INPUT}
            />
          </Field>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Statut juridique">
            <select name="statutJuridique" className={INPUT}>
              <option>Entreprise Individuelle (EI)</option>
              <option>SARL</option>
              <option>SA</option>
              <option>Autre</option>
            </select>
          </Field>
          <Field label="Pays d’implantation">
            <select name="pays" className={INPUT}>
              <option>Madagascar</option>
              <option>Canada</option>
            </select>
          </Field>
        </div>

        <Field label="Site web (optionnel)">
          <input
            type="url"
            name="siteweb"
            placeholder="https://www.entreprise.mg"
            className={INPUT}
          />
        </Field>

        <Rubrique titre="Le représentant" />
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Nom du représentant">
            <input
              type="text"
              name="nomRep"
              required
              autoComplete="family-name"
              placeholder="Nom"
              className={INPUT}
            />
          </Field>
          <Field label="Prénom">
            <input
              type="text"
              name="prenomRep"
              required
              autoComplete="given-name"
              placeholder="Prénom"
              className={INPUT}
            />
          </Field>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Fonction">
            <input
              type="text"
              name="repTitre"
              placeholder="Ex. Directrice Générale"
              className={INPUT}
            />
          </Field>
          <Field label="Téléphone">
            <input
              type="tel"
              name="tel"
              placeholder="+261 3…"
              className={INPUT}
            />
          </Field>
        </div>

        <Rubrique titre="Votre projet" />
        <Field label="Décrivez brièvement votre activité">
          <textarea
            name="desc"
            rows={3}
            placeholder="Votre activité, vos produits ou services, vos marchés…"
            className={INPUT}
          />
        </Field>

        <Field label="Motivation à rejoindre CanCham">
          <textarea
            name="motivation"
            rows={3}
            placeholder="Pourquoi souhaitez-vous rejoindre la chambre…"
            className={INPUT}
          />
        </Field>

        <div className="mt-3">
          <BoutonEnvoi enCours="Envoi de la demande…">
            Créer mon compte
          </BoutonEnvoi>
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

const INPUT = CHAMP_AUTH;

const Field = ChampAuth;

/** Intertitre d'un groupe de champs : le formulaire se lit par étapes. */
function Rubrique({
  titre,
  premiere = false,
}: {
  titre: string;
  premiere?: boolean;
}) {
  return (
    <div
      className={`surtitre text-marque-vert ${
        premiere ? "" : "pt-5 mt-1.5 border-t border-line"
      }`}
    >
      {titre}
    </div>
  );
}
