import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  Alerte,
  CadreAuth,
  ChampAuth,
  CHAMP_AUTH,
} from "@/components/public/CadreAuth";
import { BoutonEnvoi } from "@/components/public/BoutonMarque";
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
      photo="/photos/cancham-16.jpg"
      alt="Rencontre du réseau CanCham à Antananarivo"
      accroche={
        <>
          Deux pays. Un réseau. Des opportunités<span aria-hidden>.</span>
        </>
      }
      sous="Retrouvez l’annuaire des membres, les rendez-vous de la chambre et vos échanges."
    >
      <span className="surtitre text-marque-rouge">Espace membre</span>
      <h1 className="titre text-[clamp(26px,3.4vw,34px)] m-0 mt-2.5 mb-2">
        Connexion
      </h1>
      <p className="text-[14.5px] text-muted m-0 mb-7">
        Entrez vos identifiants pour accéder à votre espace.
      </p>

      {erreur ? <Alerte>{erreur}</Alerte> : null}

      <form action={connexion} className="flex flex-col gap-4">
        {suite?.startsWith("/") ? (
          <input type="hidden" name="suite" value={suite} />
        ) : null}

        <ChampAuth label="Adresse courriel">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            autoFocus
            defaultValue={email ?? ""}
            placeholder="vous@entreprise.mg"
            className={CHAMP_AUTH}
          />
        </ChampAuth>

        <ChampAuth label="Mot de passe">
          <input
            type="password"
            name="motDePasse"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className={CHAMP_AUTH}
          />
        </ChampAuth>

        <div className="mt-2">
          <BoutonEnvoi enCours="Connexion…">Se connecter</BoutonEnvoi>
        </div>
      </form>

      <p className="text-[13.5px] text-muted mt-7 mb-0">
        Pas encore membre ?{" "}
        <Link
          href="/public/inscription"
          className="text-marque-vert font-semibold no-underline hover:underline inline-flex items-center gap-1"
        >
          Demander une adhésion <ArrowRight size={14} />
        </Link>
      </p>
      <p className="text-[12.5px] text-faint mt-3 mb-0">
        Mot de passe oublié ? L’équipe CanCham peut le réinitialiser.
      </p>
    </CadreAuth>
  );
}
