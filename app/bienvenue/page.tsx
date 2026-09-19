import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, Building2, Phone, User } from "lucide-react";
import {
  CadreAuth,
  ChampAuth,
  CHAMP_AUTH,
  Saisie,
} from "@/components/public/CadreAuth";
import { BoutonEnvoi } from "@/components/public/BoutonMarque";
import { PAYS } from "@/components/public/ChoixFormule";
import { Saillant } from "@/components/ui";
import {
  ETAPES_ACCUEIL,
  NOMBRE_ETAPES,
  PROVISOIRE,
  numeroEtape,
  saisi,
  type EtapeAccueil,
} from "@/lib/accueil";
import { enregistrerEtape, terminerAccueil } from "@/lib/actions/accueil";
import {
  ORDRE_FORMULES,
  fmtCotisation,
  libelleFormule,
} from "@/lib/membership";
import { getMember } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import type { Member, User as Utilisateur } from "@/lib/types";

/**
 * Accueil d'un nouvel inscrit : la présentation, une étape à la fois.
 *
 * Chaque étape se valide (« Suivant ») ou se passe (« Ignorer ») ; « Terminer
 * plus tard » mène à l'espace, où un bandeau propose d'y revenir. Les champs
 * reprennent ce qui est déjà enregistré : revenir sur une étape, c'est la
 * corriger.
 */

const TEXTES: Record<
  EtapeAccueil,
  {
    titre: string;
    intro: string;
    accroche: React.ReactNode;
    sous: string;
  }
> = {
  vous: {
    titre: "Présentez-vous",
    intro: "La personne que l’équipe CanCham contactera pour votre adhésion.",
    accroche: (
      <>
        Faisons <Saillant>connaissance</Saillant>.
      </>
    ),
    sous: "Quelques mots sur vous : l’équipe CanCham saura qui appeler, et les autres membres qui contacter.",
  },
  entreprise: {
    titre: "Votre entreprise",
    intro: "Ces informations composent votre fiche dans l’annuaire des membres.",
    accroche: (
      <>
        Votre entreprise, <Saillant ton="vert">en vitrine</Saillant>.
      </>
    ),
    sous: "Nom, secteur, ville : c’est ce que les membres voient en premier dans l’annuaire.",
  },
  formule: {
    titre: "Votre formule",
    intro: "Elle fixe votre cotisation annuelle. L’équipe la confirme avec vous avant tout règlement.",
    accroche: (
      <>
        La formule qui vous <Saillant>ressemble</Saillant>.
      </>
    ),
    sous: "Entreprise, consultant, ONG ou partenaire : chaque formule a sa cotisation, réglée une fois par an.",
  },
  activite: {
    titre: "Votre activité",
    intro: "Ce que vous faites et ce que vous cherchez : c’est ce qui déclenche les mises en relation.",
    accroche: (
      <>
        Racontez votre <Saillant ton="vert">activité</Saillant>.
      </>
    ),
    sous: "Une fiche complète attire les bonnes rencontres : acheteurs, partenaires, fournisseurs.",
  },
};

export default async function BienvenuePage({
  searchParams,
}: {
  searchParams: Promise<{ etape?: string }>;
}) {
  const user = await getCurrentUser("membre");
  const membre = user.memberId ? await getMember(user.memberId) : null;
  if (!membre) notFound();

  const numero = numeroEtape((await searchParams).etape);
  const etape = ETAPES_ACCUEIL[numero - 1].cle;
  const texte = TEXTES[etape];
  const derniere = numero === NOMBRE_ETAPES;

  return (
    <CadreAuth
      photo="/photos/auth-rencontre.jpg"
      alt="Membres et partenaires réunis lors d’une rencontre CanCham"
      accroche={texte.accroche}
      sous={texte.sous}
    >
      <Progression numero={numero} />

      <span className="surtitre text-marque-vert">
        Étape {numero} sur {NOMBRE_ETAPES}
      </span>
      <h1 className="titre text-[clamp(26px,3.4vw,32px)] m-0 mt-2.5 mb-2">
        {texte.titre}
      </h1>
      <p className="text-[14.5px] text-muted m-0 mb-7">{texte.intro}</p>

      {/* La clé remonte le formulaire à chaque étape : les champs repartent
          des valeurs enregistrées, pas de celles de l'étape précédente. */}
      <form
        key={etape}
        action={enregistrerEtape}
        className="flex flex-col gap-3.5"
      >
        <input type="hidden" name="etape" value={numero} />

        {etape === "vous" ? <EtapeVous user={user} /> : null}
        {etape === "entreprise" ? (
          <EtapeEntreprise membre={membre} />
        ) : null}
        {etape === "formule" ? <EtapeFormule membre={membre} /> : null}
        {etape === "activite" ? <EtapeActivite membre={membre} /> : null}

        {/* ---------- Navigation ---------- */}
        <div className="flex items-center gap-3 flex-wrap mt-4 pt-5 border-t border-line">
          {numero > 1 ? (
            <Link
              href={`/bienvenue?etape=${numero - 1}`}
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted no-underline hover:text-ink"
            >
              <ArrowLeft size={16} /> Précédent
            </Link>
          ) : null}

          <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
            {derniere ? (
              <button
                type="submit"
                formAction={terminerAccueil}
                formNoValidate
                className="btn-contour"
              >
                Ignorer
              </button>
            ) : (
              <Link
                href={`/bienvenue?etape=${numero + 1}`}
                className="btn-contour no-underline"
              >
                Ignorer
              </Link>
            )}
            <BoutonEnvoi enCours="Enregistrement…" pleineLargeur={false}>
              {derniere ? "Terminer" : "Suivant"}
            </BoutonEnvoi>
          </div>
        </div>
      </form>

      <p className="text-[13px] text-muted mt-6 mb-0 text-center">
        <Link
          href="/membre/profil"
          className="text-muted font-semibold no-underline hover:text-ink hover:underline"
        >
          Terminer plus tard
        </Link>{" "}
        · vous retrouverez ces étapes depuis votre fiche.
      </p>
    </CadreAuth>
  );
}

/* ============================ Progression ============================ */

function Progression({ numero }: { numero: number }) {
  return (
    <ol
      aria-label="Progression de l’inscription"
      className="list-none m-0 p-0 mb-7 grid gap-2"
      style={{ gridTemplateColumns: `repeat(${NOMBRE_ETAPES}, minmax(0, 1fr))` }}
    >
      {ETAPES_ACCUEIL.map((e, i) => {
        const n = i + 1;
        const etat = n < numero ? "faite" : n === numero ? "courante" : "a-venir";
        return (
          <li key={e.cle} aria-current={etat === "courante" ? "step" : undefined}>
            <Link
              href={`/bienvenue?etape=${n}`}
              className="block no-underline group"
            >
              <span
                className={`block h-1.5 rounded-full transition-colors ${
                  etat === "a-venir"
                    ? "bg-line group-hover:bg-faint/40"
                    : etat === "courante"
                      ? "bg-marque-rouge"
                      : "bg-marque-vert"
                }`}
              />
              <span
                className={`block mt-1.5 text-[11.5px] font-semibold truncate ${
                  etat === "courante"
                    ? "text-ink"
                    : "text-faint group-hover:text-muted"
                }`}
              >
                {e.court}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/* ============================ Étapes ============================ */

function EtapeVous({ user }: { user: Utilisateur }) {
  const [prenom, ...reste] = user.nom.split(" ");
  return (
    <>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <ChampAuth label="Prénom" icone={<User size={16} />}>
          <Saisie
            avecIcone
            name="prenom"
            autoComplete="given-name"
            defaultValue={prenom}
            placeholder="Prénom"
          />
        </ChampAuth>
        <ChampAuth label="Nom">
          <Saisie
            name="nom"
            autoComplete="family-name"
            defaultValue={reste.join(" ")}
            placeholder="Nom"
          />
        </ChampAuth>
      </div>
      <ChampAuth label="Fonction" icone={<Briefcase size={16} />}>
        <Saisie
          avecIcone
          name="fonction"
          autoComplete="organization-title"
          defaultValue={saisi(user.fonction, PROVISOIRE.fonction)}
          placeholder="Ex. Directrice générale"
        />
      </ChampAuth>
      <ChampAuth label="Téléphone" icone={<Phone size={16} />}>
        <Saisie
          avecIcone
          type="tel"
          name="tel"
          autoComplete="tel"
          defaultValue={user.tel ?? ""}
          placeholder="+261 3…"
        />
      </ChampAuth>
    </>
  );
}

function EtapeEntreprise({ membre }: { membre: Member }) {
  return (
    <>
      <fieldset className="m-0 p-0 border-0">
        <legend className="block text-[13px] font-semibold text-ink mb-1.5">
          Vous adhérez en tant que
        </legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Choix
            name="type"
            value="morale"
            defaultChecked={membre.type !== "physique"}
            titre="Entreprise"
            detail="Personne morale"
          />
          <Choix
            name="type"
            value="physique"
            defaultChecked={membre.type === "physique"}
            titre="Indépendant"
            detail="Personne physique"
          />
        </div>
      </fieldset>

      <ChampAuth
        label="Nom de l’entreprise"
        hint="Indépendant : laissez vide, votre fiche portera votre nom."
        icone={<Building2 size={16} />}
      >
        <Saisie
          avecIcone
          name="nom"
          autoComplete="organization"
          defaultValue={saisi(membre.nom, PROVISOIRE.entreprise)}
          placeholder="Ex. Zafy Design"
        />
      </ChampAuth>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <ChampAuth label="Secteur d’activité">
          <Saisie
            name="secteur"
            defaultValue={saisi(membre.secteur, PROVISOIRE.secteur)}
            placeholder="Ex. Artisanat & design"
          />
        </ChampAuth>
        <ChampAuth label="Ville">
          <Saisie
            name="ville"
            autoComplete="address-level2"
            defaultValue={membre.ville}
            placeholder="Antananarivo"
          />
        </ChampAuth>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <ChampAuth label="Statut juridique">
          <select
            name="statutJuridique"
            defaultValue={membre.statutJuridique ?? ""}
            className={`${CHAMP_AUTH} px-3.5`}
          >
            <option value="">À préciser</option>
            {["Entreprise Individuelle (EI)", "SARL", "SA", "Association", "Autre"].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        </ChampAuth>
        <ChampAuth label="Pays d’implantation">
          <select
            name="pays"
            defaultValue={membre.pays ?? "Madagascar"}
            className={`${CHAMP_AUTH} px-3.5`}
          >
            {PAYS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </ChampAuth>
      </div>

      <ChampAuth label="Site web (facultatif)">
        <Saisie
          type="url"
          name="siteweb"
          autoComplete="url"
          defaultValue={membre.siteweb ?? ""}
          placeholder="https://www.entreprise.mg"
        />
      </ChampAuth>
    </>
  );
}

function EtapeFormule({ membre }: { membre: Member }) {
  return (
    <fieldset className="m-0 p-0 border-0">
      <legend className="sr-only">Formule d’adhésion</legend>
      <div className="flex flex-col gap-2.5">
        {ORDRE_FORMULES.map((f) => (
          <Choix
            key={f}
            name="formule"
            value={f}
            defaultChecked={membre.formule === f}
            titre={libelleFormule(f)}
            prix={fmtCotisation(f)}
          />
        ))}
      </div>
    </fieldset>
  );
}

function EtapeActivite({ membre }: { membre: Member }) {
  return (
    <>
      <ChampAuth
        label="Votre activité en une phrase"
        hint="Elle s’affiche sous votre nom, dans l’annuaire."
      >
        <Saisie
          name="activite"
          maxLength={120}
          defaultValue={saisi(membre.activite, PROVISOIRE.activite)}
          placeholder="Ex. Huiles essentielles bio du sud de Madagascar"
        />
      </ChampAuth>
      <ChampAuth label="Présentation">
        <textarea
          name="desc"
          rows={4}
          defaultValue={saisi(membre.desc, PROVISOIRE.desc)}
          placeholder="Vos produits ou services, vos marchés, ce qui vous distingue…"
          className={`${CHAMP_AUTH} px-3.5`}
        />
      </ChampAuth>
      <ChampAuth
        label="Ce que vous recherchez"
        hint="Une ligne par besoin : acheteurs au Canada, distributeur, partenaire…"
      >
        <textarea
          name="besoins"
          rows={3}
          defaultValue={membre.besoins ?? ""}
          placeholder="Des acheteurs au Canada…"
          className={`${CHAMP_AUTH} px-3.5`}
        />
      </ChampAuth>
      <ChampAuth
        label="Logo (facultatif)"
        hint={
          membre.logo
            ? "Un logo est déjà enregistré : choisissez-en un autre pour le remplacer."
            : "PNG sur fond transparent de préférence."
        }
      >
        <input
          type="file"
          name="logo"
          accept="image/*"
          className="w-full min-w-0 rounded-lg border border-line bg-white text-ink text-[14px] px-3.5 py-2.5 outline-none focus:border-marque-vert/25 focus:bg-marque-vert/[0.06] file:mr-3 file:rounded-md file:border-0 file:bg-marque-vert/10 file:px-3 file:py-1.5 file:text-[13px] file:font-semibold file:text-marque-vert file:cursor-pointer"
        />
      </ChampAuth>
    </>
  );
}

/* ============================ Choix en carte ============================ */

/**
 * Bouton radio présenté en carte : fond vert pâle et filet vert à gauche une
 * fois choisi — le même repère que les champs en cours de saisie.
 */
function Choix({
  name,
  value,
  defaultChecked,
  titre,
  detail,
  prix,
}: {
  name: string;
  value: string;
  defaultChecked: boolean;
  titre: string;
  detail?: string;
  prix?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-line bg-white px-4 py-3.5 cursor-pointer transition-[background-color,border-color,box-shadow] hover:border-faint has-checked:border-marque-vert/25 has-checked:bg-marque-vert/[0.06] has-checked:shadow-[inset_3px_0_0_var(--marque-vert)] has-focus-visible:ring-2 has-focus-visible:ring-marque-vert/30">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      <span className="min-w-0">
        <span className="block text-[14.5px] font-semibold text-ink">
          {titre}
        </span>
        {detail ? (
          <span className="block text-[12.5px] text-muted">{detail}</span>
        ) : null}
      </span>
      {prix ? (
        <span className="shrink-0 text-[14.5px] font-bold text-marque-vert whitespace-nowrap">
          {prix}{" "}
          <span className="text-[12px] font-semibold">/ an</span>
        </span>
      ) : null}
    </label>
  );
}
