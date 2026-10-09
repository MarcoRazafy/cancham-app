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
import { Rangee, SURVOL_CARTE } from "@/components/public/Rangee";
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

const AVANTAGES = [
  "Accès prioritaire à nos missions économiques et événements signature",
  "Tarifs préférentiels sur les formations et événements payants",
  "Mise en relation qualifiée avec notre réseau bilatéral",
  "Visibilité institutionnelle au sein de la communauté CanCham",
];

const PRESIDENTE = {
  nom: "Ando Lalaina RATOVOMANANA",
  role: "Présidente du Conseil d’Administration",
  photo: "/equipe/ando-ratovomanana.jpg",
  citation:
    "Dix ans après sa création, la CanCham continue d’évoluer, portée par la motivation de celles et ceux qui la font vivre. Nous innovons dans nos formats, nos missions et nos outils, avec une seule boussole : ouvrir de vraies portes entre le Canada et Madagascar.",
};

const CADRAGE = {
  identite: "object-[center_20%]",
  pose: "object-top",
} as const;

interface Elu {
  prenom: string;
  nom: string;
  role?: string;
  photo: string;
  cadrage?: string;
}

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

function CarteElu({
  elu,
  serree = false,
  className = "",
  style,
}: {
  elu: Elu;
  serree?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <article
      style={style}
      className={`flex items-center rounded-xl bg-surface p-1.5 ${serree ? "gap-3 pr-2.5" : "gap-3.5 pr-3.5 sm:gap-4"} ${SURVOL_CARTE} ${className}`}
    >
      <Image
        src={elu.photo}
        alt={`Portrait de ${elu.prenom} ${elu.nom}`}
        width={360}
        height={360}
        sizes="130px"
        className={`block ${serree ? "w-[clamp(92px,7.2vw,104px)]" : "w-[clamp(92px,9vw,128px)]"} shrink-0 aspect-square object-cover ${elu.cadrage ?? CADRAGE.identite} rounded-[9px]`}
      />
      <div className="min-w-0">
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
    nom: "Narindrasoa RAVOAVINIRINA",
    role: "Adjointe de direction",
    photo: "/equipe/rindra-razafindrakoto.jpg",
  },
  {
    nom: "Onja ANDRIATSITOHAINA",
    role: "Chargée administrative",
    photo: "/equipe/onja-randrianarisoa.jpg",
  },
];

const FILET =
  "bg-[linear-gradient(90deg,var(--marque-rouge-clair),var(--marque-vert-clair))]";

const FILET_VERT =
  "bg-[linear-gradient(90deg,var(--marque-vert-clair),#3fc98a)]";

export const metadata: Metadata = {
  title: {
    absolute:
      "CanCham — Chambre de Commerce et de Coopération Canada–Madagascar",
  },
  alternates: { canonical: "/" },
};

const PLEIN_ECRAN = "min-h-screen flex flex-col justify-center";

export default async function PublicHome() {
  await connection();
  const [stats, evenements, actualites] = await Promise.all([
    getStatsPubliques(),
    getProchainsEvenements(8),
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
      <section
        className={`sur-sombre relative overflow-hidden bg-[var(--marque-nuit)] ${PLEIN_ECRAN}`}
      >
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

          <div
            className="absolute inset-0 mix-blend-overlay"
            style={{
              background:
                "linear-gradient(90deg, #ad0707 0%, #ad0707 16%, rgba(173,7,7,0) 42%, rgba(0,113,64,0) 58%, #007140 86%, #007140 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(173,7,7,0.62) 0%, rgba(140,20,40,0.30) 24%, rgba(15,29,44,0.80) 45%, rgba(15,29,44,0.80) 56%, rgba(0,113,64,0.32) 78%, rgba(0,113,64,0.60) 100%)",
            }}
          />
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

          <div className="scene grid gap-6 sm:grid-cols-2 mt-7">
            {PROFILS.map((p, i) => (
              <article
                key={p.titre}
                style={retard(i * 70)}
                className={`reveler reveler-zoom carte-filet ${p.filet} group rounded-xl bg-white p-10`}
              >
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

      <section className={`vitrine-claire overflow-x-clip ${PLEIN_ECRAN}`}>
        <div className={`${CONTENEUR} w-full py-16`}>
          <div className="scene grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
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

              <ul className="list-none m-0 mt-6 p-0 flex flex-col gap-2.5">
                {ORDRE_FORMULES.map((f, i) => (
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

      {actualites.length ? (
        <section
          id="actualites"
          className={`vitrine-claire scroll-mt-[124px] bg-[#fafafa]! ${PLEIN_ECRAN}`}
        >
          <div className={`${CONTENEUR} w-full py-16`}>
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
      <section id="conseil" className="relative scroll-mt-[124px]">
        <span
          aria-hidden
          className={`scene reveler reveler-trait absolute inset-x-0 top-0 h-2.5 ${FILET}`}
        />

        <div className={`${CONTENEUR} py-16 md:py-24`}>
          <div className="scene grid gap-x-12 gap-y-12 xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)] xl:items-start">
            <div>
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

            <figure
              style={retard(150)}
              className="reveler reveler-droite relative m-0 flex flex-col gap-x-7 gap-y-5 rounded-[22px] bg-surface p-4 sm:flex-row sm:p-[18px]"
            >
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

          <div className="scene mt-12">
            <div className="reveler surtitre text-white">
              Le bureau du Conseil
            </div>
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

          <div className="scene mt-10">
            <div className="reveler surtitre text-white">Les conseillères</div>
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

          <div className="scene reveler relative mt-16 overflow-hidden rounded-3xl bg-[var(--marque-nuit-2)] p-7 md:p-12">
            <span
              aria-hidden
              style={retard(250)}
              className={`reveler reveler-trait absolute inset-x-0 top-0 h-1 ${FILET_VERT}`}
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

            <Rangee
              ecart={28}
              className="mt-8"
              largeur="w-[78cqw] sm:w-[calc((100cqw-var(--ecart))/2)] lg:w-[calc((100cqw-3*var(--ecart))/4)]"
            >
              {EQUIPE.map((m, i) => (
                <article
                  key={m.nom}
                  style={retard(200 + i * 70)}
                  className={`reveler reveler-zoom ${SURVOL_CARTE}`}
                >
                  <Image
                    src={m.photo}
                    alt={`Portrait de ${m.nom}`}
                    width={900}
                    height={900}
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
            </Rangee>
          </div>
        </div>
      </section>

      <section
        id="newsletter"
        className="relative overflow-hidden scroll-mt-[124px] bg-[linear-gradient(135deg,#8b0a1f_0%,#c8102e_30%,#0f1d2c_55%,#1b7e3e_85%,#0f5028_100%)] text-white"
      >
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
