import { BoutonEnvoi } from "@/components/public/BoutonMarque";
import { submitAdhesion } from "@/lib/actions/members";
import { ChoixFormule } from "@/components/public/ChoixFormule";

export default function AdhesionPage() {
  return (
    <>
      <main className="max-w-[720px] mx-auto px-5 py-10 md:py-12 w-full">
        <span className="surtitre text-marque-rouge">Formulaire public</span>
        <h1 className="titre text-[clamp(26px,4vw,36px)] font-extrabold mt-2.5 mb-3">
          Devenir membre de CanCham Madagascar
        </h1>
        <p className="text-[15px] leading-relaxed text-muted m-0 mb-8 max-w-[56ch]">
          Complétez ce formulaire pour soumettre votre candidature. Un profil
          est créé immédiatement : vous pourrez le compléter, mais l’accès aux
          autres services ne sera activé qu’après validation par l’équipe et
          paiement de la cotisation.
        </p>

        <form
          action={submitAdhesion}
          className="rounded-2xl border border-line bg-surface shadow-[var(--shadow)] p-5 md:p-8 flex flex-col gap-3.5"
        >
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

          <div className="grid gap-3.5 md:grid-cols-2">
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

          <div className="grid gap-3.5 md:grid-cols-2">
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
          <div className="grid gap-3.5 md:grid-cols-2">
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

          <Field label="Fonction">
            <input
              type="text"
              name="repTitre"
              placeholder="Ex. Directrice Générale"
              className={INPUT}
            />
          </Field>

          <div className="grid gap-3.5 md:grid-cols-2">
            <Field label="Courriel">
              <input
                type="email"
                name="email"
                placeholder="contact@entreprise.mg"
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
              Envoyer ma demande d’adhésion
            </BoutonEnvoi>
          </div>
        </form>

        <p className="text-[12.5px] text-muted mt-5 text-center">
          Votre candidature est enregistrée et apparaît immédiatement dans le
          back-office de l’équipe CanCham.
        </p>
      </main>
    </>
  );
}

const INPUT =
  "w-full min-w-0 rounded-lg border border-line bg-white text-ink placeholder:text-faint px-3.5 py-3 text-[13.8px] outline-none transition-colors focus:border-marque-vert focus:ring-2 focus:ring-marque-vert/15";

/**
 * Intertitre d'un groupe de champs : le formulaire se lit par étapes.
 *
 * `premiere` plutôt que `first:` — une action serveur glisse des champs
 * cachés en tête du formulaire, et le premier intertitre n'est plus le
 * premier enfant.
 */
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-semibold text-ink mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
