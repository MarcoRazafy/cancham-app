import type { Metadata } from "next";
import Image from "next/image";
import {
  CONTENEUR,
  TITRE_BLOC,
  TITRE_GRAS,
  TITRE_SECTION,
} from "@/components/public/CadreVitrine";
import { Saillant } from "@/components/ui";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Box, Building2, Globe, Star } from "lucide-react";
import { CarrouselCartes } from "@/components/public/CarrouselCartes";
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
 */
const PRESIDENTE = {
  nom: "Ando Lalaina RATOVOMANANA",
  role: "Présidente du Conseil d’Administration",
  photo: "/equipe/ando-ratovomanana.jpg",
  citation:
    "Dix ans après sa création, la CanCham continue d’évoluer, portée par la motivation de celles et ceux qui la font vivre. Nous innovons dans nos formats, nos missions et nos outils, avec une seule boussole : ouvrir de vraies portes entre le Canada et Madagascar.",
};

/** Le bureau du Conseil : les élus, autour de la présidente. */
const BUREAU = [
  {
    nom: "Rojonirina Patrick ANDRIANTSOAMANALINA",
    role: "Vice-Président",
    photo: "/equipe/patrick-andriantsoamanalina.jpg",
  },
  {
    nom: "Lalaina Alfred ANDRIANJATOVO",
    role: "Trésorier",
    photo: "/equipe/alfred-andrianjatovo.jpg",
  },
  {
    nom: "Danie RABODOVOLOLONIAINA",
    role: "Secrétaire",
    photo: "/equipe/danie-rabodovololoniaina.jpg",
  },
];

const CONSEILLERES = [
  { nom: "Tiana RAKOTOMALALA", photo: "/equipe/tiana-rakotomalala.jpg" },
  { nom: "Hope TARVERDIAN", photo: "/equipe/hope-tarverdian.jpg" },
  {
    nom: "Anna Josée RANDRIAMAROLAHY",
    photo: "/equipe/anna-josee-randriamarolahy.jpg",
  },
  { nom: "Elodie RABENIVO", photo: "/equipe/elodie-rabenivo.jpg" },
];

/**
 * L'équipe permanente, salariée — à ne pas confondre avec le Conseil, qui est
 * élu. D'où le bloc à part et le vert : ce sont les personnes qu'un membre a
 * au téléphone.
 */
const EQUIPE = [
  {
    nom: "Alice RATISBONNE",
    role: "Directrice Exécutive",
    photo: "/equipe/alice-ratisbonne.jpg",
  },
  {
    nom: "Tahina RAZAFIMAMONJY",
    role: "Représentant au Canada",
    photo: "/equipe/tahina-razafimamonjy.jpg",
  },
  {
    nom: "Rindra RAZAFINDRAKOTO",
    role: "Adjointe de direction",
    photo: "/equipe/rindra-razafindrakoto.jpg",
  },
  {
    nom: "Onja RANDRIANARISOA",
    role: "Chargée administrative",
    photo: "/equipe/onja-randrianarisoa.jpg",
  },
];

/**
 * Le filet rouge-vert de la charte, posé sur le bleu nuit.
 *
 * Les teintes pleines y perdent : le vert #007140 passe pour du gris foncé.
 * On prend leurs déclinaisons claires, celles que la vitrine sombre réserve
 * déjà au texte de marque.
 */
const FILET =
  "bg-[linear-gradient(90deg,var(--marque-rouge-clair),var(--marque-vert-clair))]";

/** Le même filet, tout en vert : il signale l'équipe salariée, pas les élus. */
const FILET_VERT =
  "bg-[linear-gradient(90deg,var(--marque-vert-clair),#3fc98a)]";

/**
 * Décalage de l'apparition d'un élément dans une rangée.
 *
 * Les apparitions au défilement suivent la position dans la page, pas une
 * horloge : un délai en secondes n'y ferait rien. C'est donc la plage de
 * déclenchement qu'on décale — chaque carte entre un peu après la
 * précédente, et la rangée se dévoile en cascade.
 *
 * La plage s'achève pendant l'entrée, jamais plus tard : un bloc situé tout
 * en bas de page ne peut pas toujours défiler jusqu'au bout, et resterait
 * alors à demi transparent.
 */
const cascade = (i: number) => ({
  animationRange: `entry ${10 + i * 9}% entry ${64 + i * 9}%`,
});

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
      {/* ==================== Bannière ==================== */}
      <section className="sur-sombre relative overflow-hidden bg-[var(--marque-nuit)]">
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

        <div className={`relative ${CONTENEUR} pt-10 md:pt-14 pb-0`}>
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
      <section className={`${CONTENEUR} pt-10 pb-14`}>
        <div>
          <span className="apparition-defilement surtitre text-marque-rouge inline-flex items-center gap-3">
            <span aria-hidden="true" className="w-8 h-px bg-marque-rouge" />À
            qui nous parlons
          </span>
          <div className="apparition-defilement grid gap-x-10 gap-y-4 lg:grid-cols-2 lg:items-end mt-2.5">
            <h2 className={TITRE_SECTION}>
              Vous avez votre place <Saillant>chez nous.</Saillant>
            </h2>
            <p className="m-0 text-[15px] text-muted leading-relaxed">
              Que vous portiez une grande entreprise ou que vous lanciez votre
              premier projet, que vous soyez à Antananarivo, à Montréal ou
              ailleurs — il y a une porte qui s’ouvre pour vous.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 mt-7">
            {PROFILS.map((p, i) => (
              <article
                key={p.titre}
                style={cascade(i)}
                className={`apparition-defilement carte-filet ${p.filet} group rounded-xl bg-white p-10`}
              >
                {/*
                  Quatre dixièmes de seconde et une détente douce, comme le
                  modèle : la tuile s'allume, s'incline et grandit d'un
                  vingtième. Rien ne saute — et rien ne bouge non plus si le
                  système demande moins d'animations (`motion-reduce`).
                */}
                <span
                  className={`w-15 h-15 rounded-[10px] bg-[var(--marque-nuit)] text-white flex items-center justify-center transition-[background,transform,rotate,scale] duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none group-hover:-rotate-6 group-hover:scale-[1.06] ${p.tuile}`}
                >
                  <p.icone size={28} strokeWidth={1.5} />
                </span>
                <h3
                  className={`${TITRE_BLOC} text-[var(--marque-nuit)] mt-6 mb-3.5`}
                >
                  {p.titre}
                </h3>
                <p className="m-0 text-[15px] leading-[1.6] text-[#6b6b6b]">
                  {p.texte}
                </p>
              </article>
            ))}
          </div>

          {/* Le bouton du modèle, avec son halo rouge : il descend au formulaire. */}
          <div className="apparition-defilement flex justify-center mt-9">
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
      <section className="vitrine-claire">
        <div className={`${CONTENEUR} py-16`}>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            {/* ---------- L'invitation ---------- */}
            <div className="apparition-defilement">
              <span className="surtitre text-[#ad0707] inline-flex items-center gap-3">
                <span aria-hidden="true" className="w-8 h-px bg-[#ad0707]" />
                Rejoindre la communauté
              </span>
              <h2 className={`${TITRE_SECTION} mt-3 mb-6`}>
                Devenir <Saillant>membre,</Saillant> c’est entrer dans{" "}
                <Saillant ton="vert">un cercle.</Saillant>
              </h2>
              <p className="m-0 text-[18px] leading-[1.6] text-[#6b6b6b] max-w-[48ch]">
                Un cercle de dirigeants, d’entrepreneurs et d’institutions qui
                croient au pont entre le Canada et Madagascar. Et qui agissent.
              </p>

              <ul className="list-none m-0 mt-8 p-0">
                {AVANTAGES.map((a, i) => (
                  <li
                    key={a}
                    style={cascade(i)}
                    className="apparition-defilement flex items-start gap-3.5 py-3.5 border-b border-black/10 text-[15px] leading-relaxed"
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

              <div className="mt-9">
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
              style={cascade(1)}
              className="apparition-defilement carte-filet filet-fixe filet-degrade rounded-2xl bg-white p-8 md:p-12 shadow-[0_20px_60px_rgba(15,29,44,0.08)]"
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
                    className={`flex items-baseline justify-between gap-4 rounded-md bg-[#fafafa] border-l-[3px] border-transparent px-[18px] py-4 text-[14px] transition-[background-color,border-color] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
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
      <section id="evenements" className="scroll-mt-[124px]">
        <div className={`${CONTENEUR} pt-10 pb-8`}>
          <div>
            <div className="apparition-defilement flex items-end justify-between gap-6 flex-wrap">
              <div>
                <span className="surtitre text-marque-rouge">
                  Rencontrons-nous
                </span>
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
                Le carrousel entre d'un bloc : ses cartes défilent à
                l'horizontale, et une apparition posée sur chacune suivrait ce
                défilement-là plutôt que celui de la page.
              */
              <div style={cascade(1)} className="apparition-defilement mt-8">
                <CarrouselCartes debord="" libelle="Prochains rendez-vous">
                  {evenements.map((e, i) => (
                    <CarteEvenement key={e.id} evenement={e} index={i} />
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
          className="vitrine-claire scroll-mt-[124px] bg-[#fafafa]!"
        >
          <div className={`${CONTENEUR} py-16`}>
            <div>
              <span className="apparition-defilement surtitre text-[#ad0707] inline-flex items-center gap-3">
                <span aria-hidden="true" className="w-8 h-px bg-[#ad0707]" />
                Actualités récentes
              </span>
              <div className="apparition-defilement grid gap-x-10 gap-y-4 lg:grid-cols-2 lg:items-end mt-2.5">
                <h2 className={TITRE_SECTION}>
                  Ce qui se passe <Saillant>chez nous.</Saillant>
                </h2>
                <p className="m-0 text-[17px] leading-[1.6] text-[#6b6b6b]">
                  Bilans, rencontres, prises de parole — la chambre en
                  mouvement.
                </p>
              </div>

              <div style={cascade(1)} className="apparition-defilement mt-10">
                <CarrouselCartes
                  debord=""
                  libelle="Dernières actualités"
                  surFondClair
                >
                  {actualites.map((a) => (
                    <div
                      key={a.id}
                      className="snap-start shrink-0 flex w-[min(86vw,420px)]"
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
        <span
          aria-hidden
          className={`absolute inset-x-0 top-0 h-2.5 ${FILET}`}
        />

        <div className={`${CONTENEUR} py-16 md:py-24`}>
          <div className="apparition-defilement max-w-[780px]">
            <h2 className={TITRE_SECTION}>
              Celles et ceux qui portent la chambre.
            </h2>
            <span
              aria-hidden
              className={`block w-[140px] h-1.5 rounded-full mt-6 ${FILET}`}
            />
            <p className="m-0 mt-6 text-[17px] leading-[1.6] text-white/72">
              Notre Conseil d’Administration et notre direction exécutive,
              engagés entre le Canada et Madagascar, orientent notre action et
              veillent à ce que chaque membre y trouve sa place.
            </p>
          </div>

          {/* ---------- La présidente ---------- */}
          <div className="mt-14 grid gap-9 lg:gap-14 lg:grid-cols-[minmax(0,330px)_minmax(0,1fr)] lg:items-center">
            <div
              style={cascade(1)}
              className={`apparition-defilement rounded-[22px] p-1.5 ${FILET}`}
            >
              <Image
                src={PRESIDENTE.photo}
                alt={`Portrait d’${PRESIDENTE.nom}`}
                width={880}
                height={1100}
                sizes="(max-width: 1024px) 80vw, 330px"
                className="block w-full aspect-[4/5] object-cover rounded-[17px]"
              />
            </div>

            <figure
              style={cascade(2)}
              className="apparition-defilement m-0 min-w-0"
            >
              {/* Le guillemet ouvrant, dessiné : aucune police ne le donne à cette taille. */}
              <svg
                width="62"
                height="44"
                viewBox="0 0 64 46"
                aria-hidden="true"
                className="block fill-white/90"
              >
                <path d="M0 31C0 15 9 4 24 0l2.5 5C18 8.5 13.5 14 12.5 21c1-.3 2-.4 3-.4 6.4 0 11.5 5 11.5 12S21.9 45 15 45C6.2 45 0 39.5 0 31zM34 31c0-16 9-27 24-31l2.5 5C52 8.5 47.5 14 46.5 21c1-.3 2-.4 3-.4 6.4 0 11.5 5 11.5 12S55.9 45 49 45c-8.8 0-15-5.5-15-14z" />
              </svg>

              {/*
                En italique d'Inter, comme les mots saillants des titres : la
                vitrine n'a que deux fontes, et Hammersmith One n'existe
                qu'en romain.
              */}
              <blockquote className="m-0 mt-5 max-w-[62ch] text-[clamp(17px,1.65vw,23px)] font-medium italic leading-[1.5]">
                {PRESIDENTE.citation}
              </blockquote>

              <figcaption className="mt-6">
                <span
                  className={`${TITRE_GRAS} block text-[clamp(17px,1.5vw,21px)] leading-[1.25]`}
                >
                  {PRESIDENTE.nom}
                </span>
                <span className="block mt-1 text-[14px] text-white/72">
                  {PRESIDENTE.role}
                </span>
              </figcaption>
            </figure>
          </div>

          {/* ---------- Le bureau du Conseil ---------- */}
          <div className="mt-16">
            <span aria-hidden className={`block h-0.5 ${FILET}`} />
            <div className="apparition-defilement surtitre text-white/72 mt-7">
              Le bureau du Conseil
            </div>

            <div className="mt-6 grid gap-x-9 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {BUREAU.map((m, i) => (
                <article
                  key={m.nom}
                  style={cascade(i + 1)}
                  className="apparition-defilement"
                >
                  {/*
                    Cadrage haut : ces portraits sont des photos d'identité, et
                    un cadre centré leur couperait le front.
                  */}
                  <Image
                    src={m.photo}
                    alt={`Portrait de ${m.nom}`}
                    width={520}
                    height={520}
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 400px"
                    className="block w-full h-[clamp(240px,24vw,320px)] object-cover object-[center_20%] rounded-2xl"
                  />
                  <span
                    aria-hidden
                    className={`block w-12 h-1 rounded-full mt-4 ${FILET}`}
                  />
                  <div className="surtitre mt-4 text-white">{m.role}</div>
                  <h3
                    className={`${TITRE_GRAS} m-0 mt-2 text-[19px] leading-[1.3]`}
                  >
                    {m.nom}
                  </h3>
                </article>
              ))}
            </div>
          </div>

          {/* ---------- Les conseillères ---------- */}
          <div className="mt-14">
            <div className="apparition-defilement surtitre text-white/72">
              Les conseillères
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {CONSEILLERES.map((c, i) => (
                <article
                  key={c.nom}
                  style={cascade(i + 1)}
                  className="apparition-defilement relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl bg-surface px-4 pt-8 pb-7 text-center"
                >
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 top-0 h-[3px] ${FILET}`}
                  />
                  <Image
                    src={c.photo}
                    alt={`Portrait de ${c.nom}`}
                    width={520}
                    height={520}
                    sizes="104px"
                    className="block w-[104px] h-[104px] shrink-0 rounded-full object-cover object-top"
                  />
                  <h3 className={`${TITRE_GRAS} m-0 text-[18px] leading-[1.3]`}>
                    {c.nom}
                  </h3>
                </article>
              ))}
            </div>
          </div>

          {/* ---------- L'équipe permanente ---------- */}
          {/*
            Dans son propre cadre, et en vert : le Conseil est élu, l'équipe
            est salariée. Ce sont deux choses différentes, et ce sont ces
            personnes-là qu'un membre a au téléphone.
          */}
          <div className="apparition-defilement relative mt-16 overflow-hidden rounded-3xl bg-[var(--marque-nuit-2)] p-7 md:p-12">
            <span
              aria-hidden
              className={`absolute inset-x-0 top-0 h-1 ${FILET_VERT}`}
            />

            <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-4">
              <div>
                <div className="surtitre text-marque-vert">
                  L’équipe exécutive
                </div>
                <h3 className={`${TITRE_BLOC} mt-2.5`}>
                  Au quotidien, à vos côtés.
                </h3>
              </div>
              <p className="m-0 max-w-[52ch] text-[15.5px] leading-[1.6] text-white/72">
                L’équipe permanente met en œuvre les orientations du Conseil et
                accompagne chaque membre dans ses projets.
              </p>
            </div>

            <div className="mt-8 grid gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
              {EQUIPE.map((m, i) => (
                <article key={m.nom} style={cascade(i + 1)}>
                  <Image
                    src={m.photo}
                    alt={`Portrait de ${m.nom}`}
                    width={520}
                    height={520}
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 290px"
                    className="block w-full h-[clamp(210px,20vw,260px)] object-cover object-[center_20%] rounded-2xl"
                  />
                  <span
                    aria-hidden
                    className={`block w-12 h-1 rounded-full mt-4 ${FILET_VERT}`}
                  />
                  <div className="surtitre mt-4 text-marque-vert">{m.role}</div>
                  <h3
                    className={`${TITRE_GRAS} m-0 mt-2 text-[19px] leading-[1.3]`}
                  >
                    {m.nom}
                  </h3>
                </article>
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
        <div className={`${CONTENEUR} relative py-20 text-center`}>
          <span className="apparition-defilement inline-flex items-center rounded-full border border-white/30 bg-white/15 px-[18px] py-2 text-[12px] font-bold uppercase tracking-[2px]">
            Restons en contact
          </span>
          <h2
            style={cascade(1)}
            className={`${TITRE_SECTION} apparition-defilement mt-7`}
          >
            S’inscrire à notre newsletter
          </h2>
          <p
            style={cascade(2)}
            className="apparition-defilement m-0 mt-5 mx-auto max-w-[62ch] text-[16px] leading-[1.6] text-white/85"
          >
            Nos actualités, nos invitations en avant-première et nos ressources
            exclusives, directement dans votre boîte mail. Désinscription à tout
            moment.
          </p>

          <div style={cascade(3)} className="apparition-defilement">
            <FormulaireInfolettre />
          </div>
        </div>
      </section>
    </>
  );
}
