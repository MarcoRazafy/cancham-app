import Link from "next/link";
import { BoutonEnvoi } from "@/components/public/BoutonMarque";
import { ChoixFormule, PAYS } from "@/components/public/ChoixFormule";
import { submitAdhesion } from "@/lib/actions/members";

const CHAMP =
  "w-full rounded-lg border border-white/15 bg-white/[0.04] text-white placeholder:text-white/35 px-3.5 py-3 text-[13.8px] outline-none transition-colors focus:border-marque-vert focus:bg-white/[0.07]";

const ETIQUETTE = "block text-[12.5px] font-semibold text-white/70 mb-1.5";

/**
 * Formulaire d'adhésion de la page d'accueil.
 *
 * Il reprend champ pour champ la fiche d'inscription de la chambre et poste
 * vers la même action serveur que le formulaire détaillé de `/public/adhesion` :
 * une candidature déposée ici apparaît immédiatement dans le back-office.
 */
export function FormulaireAdhesion({ secteurs }: { secteurs: string[] }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6 md:p-7">
      <h3 className="titre text-[20px] m-0 mb-5">Demande d’adhésion</h3>

      <form action={submitAdhesion} className="flex flex-col gap-4">
        {/*
          Mêmes champs, dans le même ordre, que la fiche d'inscription de la
          chambre : un candidat qui a déjà rempli l'une retrouve l'autre.
        */}

        <div>
          <label htmlFor="ad-formule" className={ETIQUETTE}>
            Formule d’adhésion
          </label>
          <ChoixFormule id="ad-formule" className={CHAMP} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ad-nomrep" className={ETIQUETTE}>
              Nom
            </label>
            <input
              id="ad-nomrep"
              name="nomRep"
              type="text"
              required
              autoComplete="family-name"
              placeholder="Votre nom"
              className={CHAMP}
            />
          </div>
          <div>
            <label htmlFor="ad-prenomrep" className={ETIQUETTE}>
              Prénom
            </label>
            <input
              id="ad-prenomrep"
              name="prenomRep"
              type="text"
              required
              autoComplete="given-name"
              placeholder="Prénom"
              className={CHAMP}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ad-email" className={ETIQUETTE}>
              Courriel
            </label>
            <input
              id="ad-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="contact@entreprise.mg"
              className={CHAMP}
            />
          </div>
          <div>
            <label htmlFor="ad-tel" className={ETIQUETTE}>
              Numéro de téléphone
            </label>
            <input
              id="ad-tel"
              name="tel"
              type="tel"
              autoComplete="tel"
              placeholder="+261 34 00 000 00"
              className={CHAMP}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ad-ville" className={ETIQUETTE}>
              Ville
            </label>
            <input
              id="ad-ville"
              name="ville"
              type="text"
              required
              autoComplete="address-level2"
              placeholder="Antananarivo"
              className={CHAMP}
            />
          </div>
          <div>
            <label htmlFor="ad-pays" className={ETIQUETTE}>
              Pays
            </label>
            <select
              id="ad-pays"
              name="pays"
              defaultValue="Madagascar"
              className={CHAMP}
              style={{ colorScheme: "light" }}
            >
              {PAYS.map((pays) => (
                <option key={pays} value={pays}>
                  {pays}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="ad-nom" className={ETIQUETTE}>
            Nom de l’entreprise représentée
          </label>
          <input
            id="ad-nom"
            name="nom"
            type="text"
            required
            placeholder="Mettre N/A si pas d’entreprise"
            className={CHAMP}
          />
        </div>

        <div>
          <label htmlFor="ad-secteur" className={ETIQUETTE}>
            Secteur d’activité{" "}
            <span className="font-normal text-white/45">(facultatif)</span>
          </label>
          <select
            id="ad-secteur"
            name="secteur"
            className={CHAMP}
            defaultValue=""
            style={{ colorScheme: "light" }}
          >
            <option value="">Sélectionner</option>
            {secteurs.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value="Autre secteur">Autre secteur</option>
          </select>
        </div>

        <div>
          <label htmlFor="ad-motivation" className={ETIQUETTE}>
            Vos motivations à nous rejoindre
          </label>
          <textarea
            id="ad-motivation"
            name="motivation"
            rows={3}
            required
            placeholder="Ce que vous attendez du réseau CanCham…"
            className={CHAMP}
          />
        </div>

        <label
          htmlFor="ad-consent"
          className="flex items-start gap-2.5 text-[13px] text-white/70 cursor-pointer"
        >
          <input
            id="ad-consent"
            name="consentement"
            type="checkbox"
            required
            className="mt-0.5 w-4 h-4 accent-[var(--marque-rouge)] cursor-pointer"
          />
          <span>J’accepte d’être contacté au sujet de mon adhésion.</span>
        </label>

        <BoutonEnvoi enCours="Envoi de la candidature…">
          Envoyer ma candidature
        </BoutonEnvoi>

        <p className="text-[12px] text-white/50 m-0">
          L’adhésion devient active après validation et règlement de la
          cotisation.
        </p>

        <p className="text-[13px] text-white/60 m-0">
          Déjà membre ?{" "}
          <Link
            href="/membre"
            className="text-marque-vert font-semibold underline underline-offset-2"
          >
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
