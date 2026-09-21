import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import {
  Alerte,
  CadreAuth,
  ChampAuth,
  ChampMotDePasse,
  Saisie,
} from "@/components/public/CadreAuth";
import { BoutonEnvoi, EcranPassage } from "@/components/public/BoutonMarque";
import { Saillant } from "@/components/ui";
import { connexion } from "@/lib/actions/auth";
import { utilisateurConnecte } from "@/lib/session";

/**
 * Connexion — première page de l'espace public.
 *
 * Qui est déjà connecté n'a rien à y faire : on le renvoie chez lui.
 */
export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; email?: string; suite?: string }>;
}) {
  const { erreur, email, suite } = await searchParams;

  const connecte = await utilisateurConnecte();
  if (connecte) redirect(connecte.role === "admin" ? "/admin" : "/membre");

  return (
    <CadreAuth
      photo="/photos/auth-rencontre.jpg"
      alt="Membres et partenaires réunis lors d’une rencontre CanCham"
      accroche={
        <>
          Deux pays. Un <Saillant>réseau</Saillant>. Des{" "}
          <Saillant ton="vert">opportunités</Saillant>
          <span aria-hidden>.</span>
        </>
      }
      sous="Retrouvez l’annuaire des membres, les rendez-vous de la chambre et vos échanges."
    >
      <span className="surtitre text-marque-rouge">Espace membre</span>
      <h1 className="titre text-[clamp(25px,3vw,32px)] m-0 mt-2.5 mb-2">
        Connexion
      </h1>
      <p className="text-[14.5px] text-muted m-0 mb-6">
        Entrez vos identifiants pour accéder à votre espace.
      </p>

      {erreur ? <Alerte>{erreur}</Alerte> : null}

      <form action={connexion} className="flex flex-col gap-4">
        {suite?.startsWith("/") ? (
          <input type="hidden" name="suite" value={suite} />
        ) : null}

        <ChampAuth label="Adresse courriel" icone={<Mail size={16} />}>
          <Saisie
            avecIcone
            type="email"
            name="email"
            required
            autoComplete="email"
            autoFocus
            defaultValue={email ?? ""}
            placeholder="vous@entreprise.mg"
          />
        </ChampAuth>

        <ChampMotDePasse
          label="Mot de passe"
          icone={<Lock size={16} />}
          name="motDePasse"
          required
          autoComplete="current-password"
          placeholder="Votre mot de passe"
        />

        <label className="flex items-center gap-2.5 text-[13.5px] text-muted cursor-pointer w-fit">
          <input
            type="checkbox"
            name="souvenir"
            value="1"
            defaultChecked
            className="w-4 h-4 accent-[var(--marque-vert)] cursor-pointer"
          />
          Se souvenir de moi
        </label>

        <div className="mt-1">
          <BoutonEnvoi enCours="Connexion…">Se connecter</BoutonEnvoi>
          <EcranPassage
            message="Ouverture de votre espace…"
            detail="Tableau de bord, messages et rendez-vous se préparent."
          />
        </div>
      </form>

      <p className="text-[13.5px] text-muted mt-6 mb-0 pt-5 border-t border-line">
        Pas encore membre ?{" "}
        <Link
          href="/public/inscription"
          className="text-marque-vert font-semibold no-underline hover:underline inline-flex items-center gap-1"
        >
          Demander une adhésion <ArrowRight size={14} />
        </Link>
      </p>
      <p className="text-[12.5px] text-faint mt-2.5 mb-0">
        Mot de passe oublié ? L’équipe CanCham peut le réinitialiser.
      </p>
    </CadreAuth>
  );
}
