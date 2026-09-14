import Link from "next/link";
import { BoutonEnvoi } from "@/components/public/BoutonMarque";
import { submitAdhesion } from "@/lib/actions/members";

const CHAMP =
  "w-full rounded-lg border border-white/15 bg-white/[0.04] text-white placeholder:text-white/35 px-3.5 py-3 text-[13.8px] outline-none transition-colors focus:border-marque-vert focus:bg-white/[0.07]";

const ETIQUETTE = "block text-[12.5px] font-semibold text-white/70 mb-1.5";

/**
 * Formulaire d'adhésion de la page d'accueil.
 *
 * Il poste vers la même action serveur que le formulaire détaillé de
 * `/public/adhesion` : une candidature déposée ici apparaît immédiatement dans
 * le back-office. Les champs absents prennent les valeurs par défaut de
 * l'action, la fiche étant complétée après validation.
 */
export function FormulaireAdhesion({ secteurs }: { secteurs: string[] }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6 md:p-7">
      <h3 className="titre text-[20px] font-bold m-0 mb-5">Demande d’adhésion</h3>

      <form action={submitAdhesion} className="flex flex-col gap-4">
        {/* L'accueil ne collecte que l'essentiel ; le reste se complète ensuite. */}
        <input type="hidden" name="type" value="morale" />
        <input type="hidden" name="pays" value="Madagascar" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ad-nom" className={ETIQUETTE}>
              Nom de l’entreprise
            </label>
            <input
              id="ad-nom"
              name="nom"
              type="text"
              required
              placeholder="Votre entreprise"
              className={CHAMP}
            />
          </div>
          <div>
            <label htmlFor="ad-secteur" className={ETIQUETTE}>
              Secteur d’activité
            </label>
            <select id="ad-secteur" name="secteur" className={CHAMP} defaultValue="">
              <option value="" disabled>
                Sélectionner
              </option>
              {secteurs.map((s) => (
                <option key={s} value={s} className="text-ink">
                  {s}
                </option>
              ))}
              <option value="Autre secteur" className="text-ink">
                Autre secteur
              </option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="ad-rep" className={ETIQUETTE}>
            Nom et prénom du contact
          </label>
          <input
            id="ad-rep"
            name="rep"
            type="text"
            required
            placeholder="Votre nom complet"
            className={CHAMP}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ad-email" className={ETIQUETTE}>
              Adresse e-mail
            </label>
            <input
              id="ad-email"
              name="email"
              type="email"
              required
              placeholder="contact@entreprise.mg"
              className={CHAMP}
            />
          </div>
          <div>
            <label htmlFor="ad-tel" className={ETIQUETTE}>
              Téléphone
            </label>
            <input
              id="ad-tel"
              name="tel"
              type="tel"
              placeholder="+261 …"
              className={CHAMP}
            />
          </div>
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

        <BoutonEnvoi enCours="Envoi de la candidature…">Envoyer ma candidature</BoutonEnvoi>

        <p className="text-[12px] text-white/50 m-0">
          L’adhésion devient active après validation et règlement de la cotisation.
        </p>

        <p className="text-[13px] text-white/60 m-0">
          Déjà membre ?{" "}
          <Link href="/membre" className="text-marque-vert font-semibold underline underline-offset-2">
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
