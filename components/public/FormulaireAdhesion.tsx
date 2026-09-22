import Link from "next/link";
import { OptionsSecteurs } from "@/components/OptionsSecteurs";
import { BoutonEnvoi } from "@/components/public/BoutonMarque";
import { ChoixFormule, PAYS } from "@/components/public/ChoixFormule";
import { deposerCandidature } from "@/lib/actions/accueil";

const CHAMP =
  "w-full min-w-0 rounded-lg border border-line bg-white text-ink placeholder:text-faint px-3.5 py-3 text-[13.8px] outline-none transition-colors focus:border-marque-vert focus:ring-2 focus:ring-marque-vert/15";

const ETIQUETTE = "block text-[12.5px] font-semibold text-ink mb-1.5";

/**
 * Formulaire d'adhésion de la page d'accueil.
 *
 * Il reprend champ pour champ la fiche d'inscription de la chambre et poste
 * vers la même action que la page d'inscription : une candidature déposée
 * ici apparaît aussitôt dans le back-office. Pas de mot de passe : quand
 * l'équipe valide la demande, un e-mail apporte le lien pour le créer.
 */
export function FormulaireAdhesion() {
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-5 md:p-7">
      <h3 className="titre text-[20px] m-0 mb-5">Demande d’adhésion</h3>

      <form action={deposerCandidature} className="flex flex-col gap-4">
        <input type="hidden" name="retour" value="/public" />
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
              required
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
            <span className="font-normal text-faint">(facultatif)</span>
          </label>
          <select
            id="ad-secteur"
            name="secteur"
            className={CHAMP}
            defaultValue=""
            style={{ colorScheme: "light" }}
          >
            <OptionsSecteurs vide="Sélectionner" />
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
          className="flex items-start gap-2.5 text-[13px] text-muted cursor-pointer"
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

        <p className="text-[12px] text-faint m-0">
          Pas de mot de passe à choisir : dès que l’équipe a validé votre
          demande, un e-mail vous apporte le lien pour le créer. L’adhésion
          devient active au règlement de la cotisation.
        </p>

        <p className="text-[13px] text-muted m-0">
          Déjà membre ?{" "}
          <Link
            href="/auth"
            className="text-marque-vert font-semibold underline underline-offset-2"
          >
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
