import { EnTetePublique } from "@/components/public/Marque";
import { BoutonEnvoi } from "@/components/public/BoutonMarque";
import { submitAdhesion } from "@/lib/actions/members";

export default function AdhesionPage() {
  return (
    <>
      <EnTetePublique />
      <main className="max-w-[660px] mx-auto px-5 py-12 w-full">
        <span className="surtitre text-white/45">Formulaire public</span>
        <h1 className="titre text-[clamp(26px,4vw,36px)] font-extrabold mt-2.5 mb-3">
          Devenir membre de CanCham Madagascar
        </h1>
        <p className="text-[15px] leading-relaxed text-white/70 m-0 mb-8 max-w-[56ch]">
          Complétez ce formulaire pour soumettre votre candidature. Un profil est créé
          immédiatement : vous pourrez le compléter, mais l’accès aux autres services
          ne sera activé qu’après validation par l’équipe et paiement de la cotisation.
        </p>

        <form action={submitAdhesion} className="flex flex-col gap-3.5">
          <Field label="Type de membre">
            <select name="type" className={INPUT}>
              <option value="morale">Entreprise (personne morale)</option>
              <option value="physique">Indépendant (personne physique)</option>
            </select>
          </Field>

          <Field label="Nom de l’entreprise">
            <input type="text" name="nom" required placeholder="Ex. Zafy Design" className={INPUT} />
          </Field>

          <div className="grid gap-3.5 md:grid-cols-2">
            <Field label="Secteur d’activité">
              <input type="text" name="secteur" placeholder="Ex. Artisanat & design" className={INPUT} />
            </Field>
            <Field label="Ville">
              <input type="text" name="ville" placeholder="Antananarivo" className={INPUT} />
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
            <input type="url" name="siteweb" placeholder="https://www.entreprise.mg" className={INPUT} />
          </Field>

          <div className="grid gap-3.5 md:grid-cols-2">
            <Field label="Nom du représentant">
              <input type="text" name="rep" placeholder="Nom complet" className={INPUT} />
            </Field>
            <Field label="Fonction">
              <input type="text" name="repTitre" placeholder="Ex. Directrice Générale" className={INPUT} />
            </Field>
          </div>

          <div className="grid gap-3.5 md:grid-cols-2">
            <Field label="Courriel">
              <input type="email" name="email" placeholder="contact@entreprise.mg" className={INPUT} />
            </Field>
            <Field label="Téléphone">
              <input type="tel" name="tel" placeholder="+261 3…" className={INPUT} />
            </Field>
          </div>

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

          <BoutonEnvoi enCours="Envoi de la demande…">
            Envoyer ma demande d’adhésion
          </BoutonEnvoi>
        </form>

        <p className="text-[12px] text-white/50 mt-5 text-center">
          Votre candidature est enregistrée et apparaît immédiatement dans le
          back-office de l’équipe CanCham.
        </p>
      </main>
    </>
  );
}

const INPUT =
  "w-full rounded-lg border border-white/15 bg-white/[0.04] text-white placeholder:text-white/35 px-3.5 py-3 text-[13.8px] outline-none focus:border-marque-vert focus:bg-white/[0.07]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-semibold text-white/70 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
