import type { Metadata } from "next";
import Image from "next/image";
import {
  CONTENEUR,
  retard,
  TITRE_BLOC,
  TITRE_GRAS,
  TITRE_SECTION,
} from "@/components/public/CadreVitrine";
import { Saillant } from "@/components/ui";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Box, Building2, Globe, Star } from "lucide-react";
import { CarrouselCartes } from "@/components/public/CarrouselCartes";
import { SURVOL_CARTE } from "@/components/public/Rangee";
import { FormulaireInfolettre } from "@/components/public/FormulaireInfolettre";
import { LienAncre } from "@/components/public/LienAncre";
import { CarteActualite } from "@/components/public/CarteActualite";
import { CarteEvenement } from "@/components/public/CarteEvenement";
import { Compteur } from "@/components/public/Compteur";
import { VISUELS } from "@/lib/images-publiques";
import {
  fmtCotisation,
  libelleFormule,
  ORDRE_FORMULES,
} from "@/lib/membership";
import {
  getActualitesPubliques,
  getProchainsEvenements,
  getStatsPubliques,
} from "@/lib/queries";

/**
 * À qui la chambre s'adresse, repris du site cancham.mg.
 *
 * Chaque carte porte sa couleur : le vert de Madagascar pour ceux qui y sont,
 * le rouge du Canada pour ceux qui le regardent, et le dégradé qui relie les
 * deux pour la diaspora. Le trait se déroule au survol, la tuile s'allume et
 * s'incline — de quoi donner envie de lire la suivante.
 */
const PROFILS = [
  {
    icone: Building2,
    titre: "Vous dirigez une entreprise à Madagascar.",
    texte:
      "Vous cherchez à explorer le marché canadien, à diversifier vos débouchés, ou simplement à rejoindre un réseau qui parle votre langage business.",
    filet: "filet-vert",
    tuile: "group-hover:bg-marque-vert",
  },
  {
    icone: Box,
    titre: "Vous lancez votre projet.",
    texte:
      "Vous portez une vision, une ambition, parfois sans le réseau pour la concrétiser. Vous avez votre place dans la conversation Canada–Madagascar.",
    filet: "filet-vert",
    tuile: "group-hover:bg-marque-vert",
  },
  {
    icone: Star,
    titre: "Vous êtes au Canada et regardez Madagascar.",
    texte:
      "Vous cherchez des fournisseurs fiables, des partenaires d’affaires, ou des opportunités d’investissement dans un marché émergent francophone.",
    filet: "filet-rouge",
    tuile: "group-hover:bg-marque-rouge",
  },
  {
    icone: Globe,
    titre: "Vous êtes Malagasy au Canada.",
    texte:
      "Vous avez construit votre vie au Canada, et Madagascar vous tient toujours à cœur. Nous transformons votre attachement en action.",
    filet: "filet-degrade",
    tuile: "group-hover:bg-[linear-gradient(120deg,#ad0707_0%,#007140_100%)]",
  },
];

/**
 * Ce que l'adhésion apporte, tel que la chambre l'annonce. Les flèches
 * alternent ses deux couleurs, comme sur son site.
 */
const AVANTAGES = [
  "Accès prioritaire à nos missions économiques et événements signature",
  "Tarifs préférentiels sur les formations et événements payants",
  "Mise en relation qualifiée avec notre réseau bilatéral",
  "Visibilité institutionnelle au sein de la communauté CanCham",
];

/**
 * Celles et ceux qui dirigent la chambre.
 *
 * Écrits ici et non en base : le conseil ne change qu'à l'assemblée générale,
 * et le back-office n'a pas d'écran pour le tenir. Le jour où il en aura un,
 * cette constante partira ; en attendant, une élection se reporte en
 * modifiant ces lignes et en déposant les portraits dans `public/equipe/`.
 *
 * Un portrait qu'on remplace prend un nouveau nom de fichier (`…-2.jpg`) :
 * une image optimisée reste quatre heures en cache, côté serveur comme dans
 * les navigateurs, et un fichier écrasé sous le même nom continuerait
 * d'afficher l'ancienne photo.
 */
const PRESIDENTE = {
  nom: "Ando Lalaina RATOVOMANANA",
  role: "Présidente du Conseil d’Administration",
  photo: "/equipe/ando-ratovomanana.jpg",
  citation:
    "Dix ans après sa création, la CanCham continue d’évoluer, portée par la motivation de celles et ceux qui la font vivre. Nous innovons dans nos formats, nos missions et nos outils, avec une seule boussole : ouvrir de vraies portes entre le Canada et Madagascar.",
};

/**
 * Quelle partie d'un portrait garder quand sa carte le rogne.
 *
 * Une photo d'identité se cadre un peu sous son bord haut : centrée, on lui
 * couperait le front. Un portrait posé — la série sur fond beige, prise à
 * mi-corps — a la tête tout en haut de l'image : il se cale sur le bord
 * supérieur, sinon ce sont les cheveux qui partent.
 */
const CADRAGE = {
  identite: "object-[center_20%]",
  pose: "object-top",
} as const;

/**
 * Une élue ou un élu du Conseil, tel que sa carte le montre : le prénom sur
 * une ligne, le nom sur la suivante.
 */
interface Elu {
  prenom: string;
  nom: string;
  /** Sa fonction au bureau. Les conseillères n'en portent pas. */
  role?: string;
  photo: string;
  cadrage?: string;
}

/** Le bureau du Conseil : les élus, autour de la présidente. */
const BUREAU: Elu[] = [
  {
    prenom: "Rojonirina Patrick",
    nom: "ANDRIANTSOAMANALINA",
    role: "Vice-président",
    photo: "/equipe/patrick-andriantsoamanalina.jpg",
  },
  {
    prenom: "Lalaina Alfred",
    nom: "ANDRIANJATOVO",
    role: "Trésorier",
    photo: "/equipe/alfred-andrianjatovo-2.jpg",
    cadrage: CADRAGE.pose,
  },
  {
    prenom: "Danie",
    nom: "RABODOVOLOLONIAINA",
    role: "Secrétaire",
    photo: "/equipe/danie-rabodovololoniaina-2.jpg",
    cadrage: CADRAGE.pose,
  },
];

const CONSEILLERES: Elu[] = [
  {
    prenom: "Tiana",
    nom: "RAKOTOMALALA",
    photo: "/equipe/tiana-rakotomalala-2.jpg",
    cadrage: CADRAGE.pose,
  },
  {
    prenom: "Hope",
    nom: "TARVERDIAN",
    photo: "/equipe/hope-tarverdian-2.jpg",
    cadrage: CADRAGE.pose,
  },
  {
    prenom: "Anna Josée",
    nom: "RANDRIAMAROLAHY",
    photo: "/equipe/anna-josee-randriamarolahy-2.jpg",
    cadrage: CADRAGE.pose,
  },
  { prenom: "Elodie", nom: "RABENIVO", photo: "/equipe/elodie-rabenivo.jpg" },
];

/**
 * La carte d'une élue ou d'un élu : son portrait à gauche, en vignette
 * carrée, son prénom et son nom à droite sur deux lignes, sa fonction dessous
 * quand elle ou il en porte une.
 */
function CarteElu({
  elu,
  serree = false,
  className = "",
  style,
}: {
  elu: Elu;
  /**
   * Quatre cartes de front : le portrait et le nom se resserrent, pour que
   * le plus long des noms tienne sur sa ligne.
   */
  serree?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <article
      style={style}
      className={`flex items-center rounded-xl bg-surface p-1.5 ${serree ? "gap-3 pr-2.5" : "gap-3.5 pr-3.5 sm:gap-4"} ${SURVOL_CARTE} ${className}`}
    >
      {/* Chaque portrait a son cadrage : voir `CADRAGE`. */}
      <Image
        src={elu.photo}
        alt={`Portrait de ${elu.prenom} ${elu.nom}`}
        width={360}
        height={360}
        sizes="130px"
        className={`block ${serree ? "w-[clamp(92px,7.2vw,104px)]" : "w-[clamp(92px,9vw,128px)]"} shrink-0 aspect-square object-cover ${elu.cadrage ?? CADRAGE.identite} rounded-[9px]`}
      />
      <div className="min-w-0">
        {/* Un nom malgache est long : plutôt que de sortir de la carte, il
            passe à la ligne. */}
        <h3
          className={`m-0 font-[family-name:var(--font-texte)]! font-medium! tracking-normal! ${serree ? "text-[clamp(15.5px,1.2vw,17px)]" : "text-[clamp(15.5px,1.3vw,19.5px)]"} leading-[1.45] [overflow-wrap:anywhere]`}
        >
          <span className="block">{elu.prenom}</span>
          <span className="block">{elu.nom}</span>
        </h3>
        {elu.role ? (
          <p className="m-0 mt-1.5 text-[13.5px] text-white/80">{elu.role}</p>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Le filet rouge-vert de la charte, posé sur le bleu nuit.
 *
 * Les teintes pleines y perdent : le vert #007140 passe pour du gris foncé.
 * On prend leurs déclinaisons claires, celles que la vitrine sombre réserve
 * déjà au texte de marque.
 */
const FILET =
  "bg-[linear-gradient(90deg,var(--marque-rouge-clair),var(--marque-vert-clair))]";

/** L'accueil porte le titre du site, sans suffixe : il l'est déjà. */
export const metadata: Metadata = {
  title: {
    absolute:
      "CanCham — Chambre de Commerce et de Coopération Canada–Madagascar",
  },
  alternates: { canonical: "/" },
};

/**
 * Page d'accueil publique, conforme à la charte CanCham.
 *
 * Tous les chiffres et les événements viennent de la base : la vitrine dit ce
 * que l'annuaire contient réellement et se met à jour d'elle-même.
 */
/** Une section à la hauteur de l'écran, son contenu centré. */
const PLEIN_ECRAN = "min-h-screen flex flex-col justify-center";

export default async function PublicHome() {
  // Lue à chaque visite : sans cela, Next la calculerait une fois pour
  // toutes à la compilation, et les chiffres comme les prochains événements
  // resteraient ceux du jour du déploiement.
  await connection();
  const [stats, evenements, actualites] = await Promise.all([
    getStatsPubliques(),
    getProchainsEvenements(8),
    // Seules les actualités diffusées sur la page publique.
    getActualitesPubliques(8),
  ]);

  const chiffres = [
    { nombre: 10, apres: " ans", libelle: "de coopération" },
    {
      nombre: stats.membres,
      apres: "",
      libelle: `entreprise${stats.membres > 1 ? "s" : ""} dans le réseau`,
    },
    {
      nombre: stats.secteurs,
      apres: "",
      libelle: `secteur${stats.secteurs > 1 ? "s représentés" : " représenté"}`,
    },
    { nombre: 2, apres: " pays", libelle: "une ambition commune" },
  ];

  return (
    <>
      {/*
        Chaque section occupe au moins la hauteur de l'écran, sur toute
        machine, son contenu centré : on en lit une à la fois. Le conseil et
        l'infolettre gardent leur hauteur propre. Un contenu plus haut que
        l'écran — sur téléphone — pousse simplement la section.
      */}
      {/* ==================== Bannière ==================== */}
      <section
        className={`sur-sombre relative overflow-hidden bg-[var(--marque-nuit)] ${PLEIN_ECRAN}`}
      >
        {/* Toronto à gauche, les baobabs à droite : les deux pays encadrent la
            bannière. Entre eux, le dégradé linéaire 90° de la charte, posé
            franchement — le rouge et le vert doivent se lire, pas se deviner. */}
        <div className="absolute inset-0" aria-hidden="true">
          {VISUELS.toronto.url ? (
            <div className="absolute inset-y-0 left-0 w-[52%] md:w-[42%]">
              <Image
                src={VISUELS.toronto.url}
                alt=""
                fill
                priority
                sizes="50vw"
                className="object-cover"
              />
              {/* Estompe le bord droit de la photo vers le fond de page. */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-[var(--marque-nuit)]/40 to-[var(--marque-nuit)]" />
            </div>
          ) : null}

          {VISUELS.madagascar.url ? (
            <div className="absolute inset-y-0 right-0 w-[44%] md:w-[34%]">
              <Image
                src={VISUELS.madagascar.url}
                alt=""
                fill
                sizes="50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-l from-transparent via-[var(--marque-nuit)]/45 to-[var(--marque-nuit)]" />
            </div>
          ) : null}

          {/* Le dégradé de la charte, en teinte : il colore les photos au lieu
              de les masquer, d'où le mode « overlay ». */}
          <div
            className="absolute inset-0 mix-blend-overlay"
            style={{
              background:
                "linear-gradient(90deg, #ad0707 0%, #ad0707 16%, rgba(173,7,7,0) 42%, rgba(0,113,64,0) 58%, #007140 86%, #007140 100%)",
            }}
          />
          {/* Reprise en opacité franche pour retrouver la densité de la charte. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(173,7,7,0.62) 0%, rgba(140,20,40,0.30) 24%, rgba(15,29,44,0.80) 45%, rgba(15,29,44,0.80) 56%, rgba(0,113,64,0.32) 78%, rgba(0,113,64,0.60) 100%)",
            }}
          />
          {/* Voile minimal, juste de quoi garantir la lisibilité du texte. */}
          <div className="absolute inset-0 bg-[var(--marque-nuit)]/22" />
        </div>

        <div className={`relative w-full ${CONTENEUR} pt-10 md:pt-14 pb-0`}>
          <div className="grid gap-9 lg:grid-cols-[1fr_minmax(0,540px)] items-center">
            <div>
              <span
                className="surtitre apparition inline-block px-3.5 py-1.5 rounded-full border border-white/30 text-white/85"
                style={{ animationDelay: "0.08s" }}
              >
                CanCham • 10 ans
              </span>

              {/*
                Le « 10 ans » doré est une image : c'est un logotype
                anniversaire, dessiné, que nulle police ne reproduirait. Il
                porte l'annonce, et le titre passe dessous en une ligne.
              */}
              <h1 className="m-0 mt-6">
                <Image
                  src="/marque/10-ans.png"
                  alt="CanCham — 10 ans"
                  width={1100}
                  height={386}
                  priority
                  sizes="(max-width: 640px) 80vw, 520px"
                  className="apparition w-[min(520px,80%)] h-auto"
                  style={{ animationDelay: "0.16s" }}
                />
                <span
                  className={`${TITRE_GRAS} apparition block text-[clamp(22px,2.9vw,36px)] leading-[1.15] mt-5`}
                  style={{ animationDelay: "0.3s" }}
                >
                  Deux pays. Un réseau. Des{" "}
                  <Saillant ton="vert">opportunités.</Saillant>
                </span>
              </h1>

              <p
                className="apparition text-[16px] leading-relaxed text-white/80 max-w-[46ch] mt-5 mb-0"
                style={{ animationDelay: "0.46s" }}
              >
                Rencontrez des entreprises, développez vos partenariats et
                donnez une nouvelle dimension à vos projets.
              </p>

              <div
                className="apparition flex flex-col sm:flex-row gap-3 mt-7"
                style={{ animationDelay: "0.56s" }}
              >
                <Link href="/auth/inscription" className="btn-action">
                  Devenir membre <ArrowRight size={17} />
                </Link>
                <LienAncre
                  href="#evenements"
                  className="btn-contour text-white hover:bg-white/10"
                >
                  Voir les événements
                </LienAncre>
              </div>
            </div>

            {VISUELS.hero.url ? (
              /*
                La photo n'est pas posée à plat : elle est montée, comme sur
                les visuels de la chambre. Deux formes arrondies la calent —
                le bleu nuit et le rouge —, une bande verticale rappelle les
                deux pays, et la légende déborde en bas sur une pastille
                blanche. Tout l'habillage est décoratif : seul le lien de la
                photo compte pour la navigation.
              */
              <figure
                className="apparition relative m-0 mb-10 group"
                style={{ animationDelay: "0.3s" }}
              >
                <span
                  aria-hidden
                  className="absolute -left-5 -top-5 w-[58%] h-[64%] rounded-[34px] bg-[var(--marque-nuit-3)]"
                />
                <span
                  aria-hidden
                  className="absolute -left-9 top-14 w-[34%] h-[38%] rounded-[30px] bg-[var(--marque-rouge)]"
                />
                <span
                  aria-hidden
                  className="absolute -left-14 -bottom-8 w-[46%] h-[42%] rounded-[34px] border border-white/20"
                />

                <div className="relative rounded-[22px] overflow-hidden border border-white/15 aspect-[16/11] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.75)]">
                  <Link
                    href="#evenements"
                    className="absolute inset-0 z-10"
                    aria-label="Voir les prochains rendez-vous"
                  />
                  <Image
                    src={VISUELS.hero.url}
                    alt={VISUELS.hero.alt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 540px"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>

                {/* Les deux pays, sur la tranche. */}
                <span
                  aria-hidden
                  className="hidden sm:flex absolute -right-4 top-10 bottom-16 w-[42px] rounded-[16px] bg-[var(--marque-rouge)] items-center justify-center"
                >
                  <span className="[writing-mode:vertical-rl] rotate-180 text-white text-[10.5px] font-bold uppercase tracking-[0.28em] whitespace-nowrap">
                    Canada × Madagascar
                  </span>
                </span>

                <figcaption className="absolute -bottom-6 -left-6 right-16 sm:right-24 rounded-[14px] bg-white px-5 py-3.5 text-[14.5px] font-semibold text-[var(--marque-nuit)] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)]">
                  Des échanges qui font grandir vos projets
                </figcaption>
              </figure>
            ) : null}
          </div>

          {/* ==================== Chiffres ==================== */}
          <dl
            className="apparition grid grid-cols-2 md:grid-cols-4 gap-y-7 mt-12 mb-0 pb-11 border-t border-white/12 pt-9"
            style={{ animationDelay: "0.68s" }}
          >
            {chiffres.map((c, i) => (
              <div
                key={c.libelle}
                className={`text-center px-3 ${
                  i > 0 ? "md:border-l md:border-white/12" : ""
                }`}
              >
                <dt className="titre text-[clamp(26px,3.4vw,34px)] text-white">
                  <Compteur valeur={c.nombre} />
                  {c.apres}
                </dt>
                <dd className="m-0 text-[13px] text-white/60">{c.libelle}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ==================== À qui nous parlons ==================== */}
      <section className={`${CONTENEUR} w-full pt-10 pb-14 ${PLEIN_ECRAN}`}>
        <div>
          <div className="scene grid gap-x-10 gap-y-4 lg:grid-cols-2 lg:items-end">
            <h2 className={`${TITRE_SECTION} reveler`}>
              Vous avez votre place <Saillant>chez nous.</Saillant>
            </h2>
            <p
              style={retard(90)}
              className="reveler m-0 text-[15px] text-muted leading-relaxed"
            >
              Que vous portiez une grande entreprise ou que vous lanciez votre
              premier projet, que vous soyez à Antananarivo, à Montréal ou
              ailleurs — il y a une porte qui s’ouvre pour vous.
            </p>
          </div>

          {/* Les cartes grandissent l'une après l'autre ; sur chacune,
              l'icône surgit une fois la carte posée. */}
          <div className="scene grid gap-6 sm:grid-cols-2 mt-7">
            {PROFILS.map((p, i) => (
              <article
                key={p.titre}
                style={retard(i * 70)}
                className={`reveler reveler-zoom carte-filet ${p.filet} group rounded-xl bg-white p-10`}
              >
                {/*
                  Quatre dixièmes de seconde et une détente douce, comme le
                  modèle : la tuile s'allume, s'incline et grandit d'un
                  vingtième. Rien ne saute — et rien ne bouge non plus si le
                  système demande moins d'animations (`motion-reduce`).
                */}
                {/* L'icône et le titre sur une même ligne : on lit d'un coup
                    d'œil à qui la carte s'adresse. */}
                <div className="flex items-center gap-4 mb-3.5">
                  <span
                    style={retard(220 + i * 70)}
                    className={`reveler reveler-pop w-15 h-15 shrink-0 rounded-[10px] bg-[var(--marque-nuit)] text-white flex items-center justify-center transition-[background,transform,rotate,scale] duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none group-hover:-rotate-6 group-hover:scale-[1.06] ${p.tuile}`}
                  >
                    <p.icone size={28} strokeWidth={1.5} />
                  </span>
                  <h3
                    className={`${TITRE_BLOC} text-[var(--marque-nuit)] m-0 min-w-0`}
                  >
                    {p.titre}
                  </h3>
                </div>
                <p className="m-0 text-[15px] leading-[1.6] text-[#6b6b6b]">
                  {p.texte}
                </p>
              </article>
            ))}
          </div>

          {/* Le bouton du modèle, avec son halo rouge : il descend au formulaire. */}
          <div className="scene reveler flex justify-center mt-9">
            <LienAncre
              href="#newsletter"
              className="btn-action shadow-[0_4px_24px_rgba(200,16,46,0.35)]"
            >
              S’inscrire à notre newsletter <ArrowRight size={17} />
            </LienAncre>
          </div>
        </div>
      </section>

      {/* ==================== Devenir membre ==================== */}
      {/*
        Une bande claire au bas d'une page sombre, comme sur cancham.mg : la
        page s'achève sur l'invitation, et le changement de fond la détache du
        reste. Les couleurs y sont écrites en clair — les jetons de la vitrine
        sont taillés pour le bleu nuit.
      */}
      <section className={`vitrine-claire overflow-x-clip ${PLEIN_ECRAN}`}>
        <div className={`${CONTENEUR} w-full py-16`}>
          {/* Le texte monte, les avantages arrivent ligne à ligne par la
              gauche, et l'encadré des formules vient de la droite. */}
          <div className="scene grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            {/* ---------- L'invitation ---------- */}
            <div>
              <h2 className={`${TITRE_SECTION} reveler mb-6`}>
                Devenir <Saillant>membre,</Saillant> c’est entrer dans{" "}
                <Saillant ton="vert">un cercle.</Saillant>
              </h2>
              <p
                style={retard(90)}
                className="reveler m-0 text-[18px] leading-[1.6] text-[#6b6b6b] max-w-[48ch]"
              >
                Un cercle de dirigeants, d’entrepreneurs et d’institutions qui
                croient au pont entre le Canada et Madagascar. Et qui agissent.
              </p>

              <ul className="list-none m-0 mt-8 p-0">
                {AVANTAGES.map((a, i) => (
                  <li
                    key={a}
                    style={retard(200 + i * 60)}
                    className="reveler reveler-gauche flex items-start gap-3.5 py-3.5 border-b border-black/10 text-[15px] leading-relaxed"
                  >
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      className={`mt-1 shrink-0 ${
                        i % 2 === 0 ? "text-[#ad0707]" : "text-[#007140]"
                      }`}
                    />
                    {a}
                  </li>
                ))}
              </ul>

              <div style={retard(460)} className="reveler mt-9">
                <Link
                  href="/auth/inscription"
                  className="btn-action shadow-[0_4px_24px_rgba(200,16,46,0.35)]"
                >
                  Devenir membre <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            {/* ---------- Les formules ---------- */}
            <div
              style={retard(160)}
              className="reveler reveler-droite carte-filet filet-fixe filet-degrade rounded-2xl bg-white p-8 md:p-12 shadow-[0_20px_60px_rgba(15,29,44,0.08)]"
            >
              <span className="surtitre text-[#ad0707]">
                Choisissez votre formule
              </span>
              <h3 className={`${TITRE_BLOC} text-[var(--marque-nuit)] mt-2.5`}>
                Cinq manières
                <br />
                de nous rejoindre.
              </h3>
              <p className="m-0 mt-3.5 text-[15px] leading-[1.6] text-[#6b6b6b]">
                Chaque profil a sa formule. Toutes donnent accès au cœur de
                notre communauté.
              </p>

              {/*
                Les tarifs viennent de la grille de `lib/membership.ts`, celle
                qui facture : la vitrine ne peut pas annoncer un prix que la
                plateforme ne pratique plus.
              */}
              <ul className="list-none m-0 mt-6 p-0 flex flex-col gap-2.5">
                {ORDRE_FORMULES.map((f, i) => (
                  /*
                    La bordure gauche existe déjà au repos, transparente :
                    elle s'allume sans pousser le texte d'un pixel.
                  */
                  <li
                    key={f}
                    style={retard(360 + i * 45)}
                    className={`reveler flex items-baseline justify-between gap-4 rounded-md bg-[#fafafa] border-l-[3px] border-transparent px-[18px] py-4 text-[14px] transition-[background-color,border-color] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
                      i % 2 === 0
                        ? "hover:border-l-[#ad0707] hover:bg-[#ad0707]/[0.05]"
                        : "hover:border-l-[#007140] hover:bg-[#007140]/[0.05]"
                    }`}
                  >
                    <span>{libelleFormule(f)}</span>
                    <span
                      className={`shrink-0 font-bold ${
                        i % 2 === 0 ? "text-[#ad0707]" : "text-[#007140]"
                      }`}
                    >
                      {fmtCotisation(f)}{" "}
                      <span className="text-[12px]">/ par an</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Événements ==================== */}
      <section id="evenements" className={`scroll-mt-[124px] ${PLEIN_ECRAN}`}>
        <div className={`${CONTENEUR} w-full pt-10 pb-8`}>
          <div>
            <div className="scene reveler flex items-end justify-between gap-6 flex-wrap">
              <div>
                <h2 className={`${TITRE_SECTION} mt-2.5`}>
                  Les prochains <Saillant>rendez-vous</Saillant>
                </h2>
                <p className="text-[15px] text-muted m-0 mt-2.5">
                  Des rencontres pour apprendre, échanger et créer des liens.
                </p>
              </div>
              {evenements.length ? (
                <span className="text-[13px] text-faint">
                  {evenements.length} à venir
                </span>
              ) : null}
            </div>

            {evenements.length ? (
              /*
                La scène est le carrousel entier, pas chaque carte : les cartes
                entrent en cascade quand il arrive à l'écran, et le défilement
                horizontal ne rejoue rien ensuite. Elles grandissent sur place
                sans monter — un déplacement vertical ferait déborder la piste.
              */
              <div className="scene mt-8">
                <CarrouselCartes debord="" libelle="Prochains rendez-vous">
                  {evenements.map((e, i) => (
                    <CarteEvenement
                      key={e.id}
                      evenement={e}
                      index={i}
                      className="reveler reveler-zoom"
                      style={retard(i * 70)}
                    />
                  ))}
                </CarrouselCartes>
              </div>
            ) : (
              <p className="text-muted mt-8 mb-0">
                Aucun rendez-vous programmé pour le moment.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ==================== Actualités ==================== */}
      {actualites.length ? (
        /*
          Bande claire, comme sur le site de la chambre : l'actualité se lit
          sur du papier, pas sur le bleu nuit. Les teintes y sont écrites en
          clair — celles de la vitrine sont taillées pour le fond sombre.
        */
        <section
          id="actualites"
          className={`vitrine-claire scroll-mt-[124px] bg-[#fafafa]! ${PLEIN_ECRAN}`}
        >
          <div className={`${CONTENEUR} w-full py-16`}>
            {/* Le trait du surtitre se déroule, le titre monte, puis les
                cartes grandissent l'une après l'autre. */}
            <div className="scene">
              <div className="grid gap-x-10 gap-y-4 lg:grid-cols-2 lg:items-end mt-2.5">
                <h2 style={retard(80)} className={`${TITRE_SECTION} reveler`}>
                  Ce qui se passe <Saillant>chez nous.</Saillant>
                </h2>
                <p
                  style={retard(160)}
                  className="reveler m-0 text-[17px] leading-[1.6] text-[#6b6b6b]"
                >
                  Bilans, rencontres, prises de parole — la chambre en
                  mouvement.
                </p>
              </div>

              <div className="mt-10">
                <CarrouselCartes
                  debord=""
                  libelle="Dernières actualités"
                  surFondClair
                >
                  {actualites.map((a, i) => (
                    <div
                      key={a.id}
                      style={retard(240 + i * 70)}
                      className="reveler reveler-zoom snap-start shrink-0 flex w-[min(86vw,420px)]"
                    >
                      <CarteActualite actualite={a} />
                    </div>
                  ))}
                </CarrouselCartes>
              </div>
            </div>
          </div>
        </section>
      ) : null}
      {/* ==================== Conseil d'administration ==================== */}
      {/*
        Les visages de la chambre, juste avant qu'on propose de s'inscrire :
        on rejoint des personnes autant qu'une organisation, et la parole de
        la présidente dit mieux que nos arguments pourquoi la maison existe.

        Le filet en haut détache la section de la bande claire des actualités.
        En bas, rien : l'infolettre ouvre déjà sur son propre dégradé, et deux
        dégradés qui se touchent ne feraient que du bruit.
      */}
      <section id="conseil" className="relative scroll-mt-[124px]">
        {/* Le filet se déroule de gauche à droite en arrivant sur la section. */}
        <span
          aria-hidden
          className={`scene reveler reveler-trait absolute inset-x-0 top-0 h-2.5 ${FILET}`}
        />

        <div className={`${CONTENEUR} py-16 md:py-24`}>
          {/*
            Le titre à gauche, la parole de la présidente à droite, dans son
            encadré : sur grand écran, l'encadré descend d'un cran pour que
            son haut tombe sous le titre plutôt qu'à sa hauteur. Plus étroit,
            l'encadré passe sous le texte.
          */}
          <div className="scene grid gap-x-12 gap-y-12 xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)] xl:items-start">
            <div>
              {/* Un cran sous l’échelle commune sur grand écran : le titre
                  tient alors en deux lignes dans sa colonne. */}
              <h2 className={`${TITRE_SECTION} reveler xl:text-[50px]`}>
                Celles et ceux qui portent <Saillant>la chambre.</Saillant>
              </h2>
              <span
                aria-hidden
                style={retard(200)}
                className={`reveler reveler-trait block w-[140px] h-1.5 rounded-full mt-6 ${FILET}`}
              />
              <p
                style={retard(120)}
                className="reveler m-0 mt-6 max-w-[52ch] text-[17px] leading-[1.6] text-white/85"
              >
                Notre Conseil d’Administration et notre direction exécutive,
                engagés entre le Canada et Madagascar, orientent notre action et
                veillent à ce que chaque membre y trouve sa place.
              </p>
            </div>

            {/* ---------- La présidente ---------- */}
            {/* L'encadré vient de la droite, et son guillemet surgit en dernier. */}
            <figure
              style={retard(150)}
              className="reveler reveler-droite relative m-0 flex flex-col gap-x-7 gap-y-5 rounded-[22px] bg-surface p-4 sm:flex-row sm:p-[18px] xl:mt-[7.5rem]"
            >
              {/* Le guillemet ouvrant, dessiné : aucune police ne le donne à
                  cette taille. Il déborde du coin de l'encadré. */}
              <svg
                width="64"
                height="46"
                viewBox="0 0 64 46"
                aria-hidden="true"
                style={retard(380)}
                className="reveler reveler-pop absolute -top-6 right-2 block fill-white/90"
              >
                <path d="M0 31C0 15 9 4 24 0l2.5 5C18 8.5 13.5 14 12.5 21c1-.3 2-.4 3-.4 6.4 0 11.5 5 11.5 12S21.9 45 15 45C6.2 45 0 39.5 0 31zM34 31c0-16 9-27 24-31l2.5 5C52 8.5 47.5 14 46.5 21c1-.3 2-.4 3-.4 6.4 0 11.5 5 11.5 12S55.9 45 49 45c-8.8 0-15-5.5-15-14z" />
              </svg>

              <Image
                src={PRESIDENTE.photo}
                alt={`Portrait d’${PRESIDENTE.nom}`}
                width={528}
                height={632}
                sizes="180px"
                className="block w-[132px] shrink-0 self-start aspect-[5/6] object-cover object-top rounded-xl sm:w-[176px]"
              />

              <div className="flex min-w-0 flex-1 flex-col sm:pt-3.5 sm:pr-3.5">
                {/*
                  En italique d'Inter, comme les mots saillants des titres :
                  la vitrine n'a que deux fontes, et Hammersmith One n'existe
                  qu'en romain.
                */}
                <blockquote className="m-0 text-[clamp(16px,1.42vw,20px)] font-semibold italic leading-[1.42]">
                  {PRESIDENTE.citation}
                </blockquote>

                <figcaption className="mt-auto pt-5 pb-1.5 text-right">
                  <span className="block font-medium text-[clamp(17px,1.5vw,21px)] leading-[1.25]">
                    {PRESIDENTE.nom}
                  </span>
                  <span className="block mt-1 text-[14px] text-white/85">
                    {PRESIDENTE.role}
                  </span>
                </figcaption>
              </div>
            </figure>
          </div>

          {/* ---------- Le bureau du Conseil ---------- */}
          <div className="scene mt-12">
            <div className="reveler surtitre text-white">
              Le bureau du Conseil
            </div>
            {/* Trois cartes de front sur grand écran ; deux, puis une seule,
                quand les noms n'y tiendraient plus. */}
            <div className="mt-6 grid gap-5 min-[52rem]:grid-cols-2 xl:grid-cols-3">
              {BUREAU.map((m, i) => (
                <CarteElu
                  key={m.nom}
                  elu={m}
                  style={retard(100 + i * 80)}
                  className="reveler reveler-zoom"
                />
              ))}
            </div>
          </div>

          {/* ---------- Les conseillères ---------- */}
          <div className="scene mt-10">
            <div className="reveler surtitre text-white">Les conseillères</div>
            {/* Quatre de front là où le conteneur atteint sa pleine largeur.
                Les seuils sont en rem, comme ceux de Tailwind : en pixels,
                ils se rangeraient mal parmi eux, et le plus petit
                l’emporterait. */}
            <div className="mt-6 grid gap-5 min-[44rem]:grid-cols-2 min-[87.5rem]:grid-cols-4">
              {CONSEILLERES.map((c, i) => (
                <CarteElu
                  key={c.nom}
                  elu={c}
                  serree
                  style={retard(100 + i * 70)}
                  className="reveler reveler-zoom"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Newsletter ==================== */}
      {/*
        La bande du site de la chambre, avec son dégradé qui va du rouge au
        vert en passant par le bleu nuit.

        Le formulaire enregistre l'inscription : la plateforme garde sa
        propre liste d'abonnés, que l'équipe retrouve dans son journal. La
        chambre tient la sienne chez systeme.io — les deux se rejoindront le
        jour où la synchronisation sera branchée.
      */}
      <section
        id="newsletter"
        className="relative overflow-hidden scroll-mt-[124px] bg-[linear-gradient(135deg,#8b0a1f_0%,#c8102e_30%,#0f1d2c_55%,#1b7e3e_85%,#0f5028_100%)] text-white"
      >
        {/*
          La trame du modèle : deux traits blancs à trois pour cent, tous les
          cinquante pixels. Elle donne du grain au dégradé sans se voir.
        */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className={`scene ${CONTENEUR} relative py-20 text-center`}>
          <span className="reveler reveler-zoom inline-flex items-center rounded-full border border-white/30 bg-white/15 px-[18px] py-2 text-[12px] font-bold uppercase tracking-[2px]">
            Restons en contact
          </span>
          <h2 style={retard(100)} className={`${TITRE_SECTION} reveler mt-7`}>
            S’inscrire à notre newsletter
          </h2>
          <p
            style={retard(180)}
            className="reveler m-0 mt-5 mx-auto max-w-[62ch] text-[16px] leading-[1.6] text-white/85"
          >
            Nos actualités, nos invitations en avant-première et nos ressources
            exclusives, directement dans votre boîte mail. Désinscription à tout
            moment.
          </p>

          <div style={retard(260)} className="reveler">
            <FormulaireInfolettre />
          </div>
        </div>
      </section>
    </>
  );
}
