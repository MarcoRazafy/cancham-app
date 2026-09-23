import Image from "next/image";
import { CONTENEUR } from "@/components/public/CadreVitrine";
import { Saillant } from "@/components/ui";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Box, Building2, Globe, Star } from "lucide-react";
import { CarrouselEvenements } from "@/components/public/CarrouselEvenements";
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
    getActualitesPubliques(3),
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
                Le réseau Canada–Madagascar
              </span>

              <h1 className="text-[clamp(34px,5.2vw,58px)] leading-[1.08] m-0 mt-5">
                <span
                  className="apparition block"
                  style={{ animationDelay: "0.16s" }}
                >
                  Deux pays.
                </span>
                <span
                  className="apparition block"
                  style={{ animationDelay: "0.26s" }}
                >
                  Un réseau.
                </span>
                {/* Insécable : « Des opportunités. » ne doit jamais se couper. */}
                <span
                  className="apparition block whitespace-nowrap"
                  style={{ animationDelay: "0.36s" }}
                >
                  Des <Saillant ton="vert">opportunités.</Saillant>
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
                <Link
                  href="#evenements"
                  className="btn-contour text-white hover:bg-white/10"
                >
                  Voir les événements
                </Link>
              </div>
            </div>

            {VISUELS.hero.url ? (
              <figure
                className="apparition relative m-0 rounded-xl overflow-hidden border border-white/15 aspect-[16/11] group"
                style={{ animationDelay: "0.3s" }}
              >
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
                <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-4 pt-10 pb-3.5 text-[13px] text-white/90">
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
      <section className={`${CONTENEUR} pt-10`}>
        <div className="apparition-defilement">
          <span className="surtitre text-marque-rouge inline-flex items-center gap-3">
            <span aria-hidden="true" className="w-8 h-px bg-marque-rouge" />À
            qui nous parlons
          </span>
          <div className="grid gap-x-10 gap-y-4 lg:grid-cols-2 lg:items-end mt-2.5">
            {/*
              Le titre du modèle est gras et tient sur deux lignes. Hammersmith
              One n'ayant qu'une graisse, il passe comme les cartes à la fonte
              de texte, en 700 — les `!` devancent la règle des h2 de la marque.
            */}
            <h2 className="font-[family-name:var(--font-texte)]! font-bold! text-[clamp(30px,4.4vw,58px)] leading-[1.06] tracking-[-0.015em] m-0">
              Vous avez votre place <Saillant>chez nous.</Saillant>
            </h2>
            <p className="m-0 text-[15px] text-muted leading-relaxed">
              Que vous portiez une grande entreprise ou que vous lanciez votre
              premier projet, que vous soyez à Antananarivo, à Montréal ou
              ailleurs — il y a une porte qui s’ouvre pour vous.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 mt-7">
            {PROFILS.map((p) => (
              <article
                key={p.titre}
                className={`carte-filet ${p.filet} group rounded-xl bg-white p-10`}
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
                {/*
                  Titre en gras, donc dans la fonte de texte : Hammersmith One
                  n'a qu'une graisse, et la charte interdit le faux gras. Les
                  `!` passent devant la règle qui coiffe tous les h3 de la
                  marque.
                */}
                <h3 className="font-[family-name:var(--font-texte)]! font-bold! text-[26px] leading-[1.2] text-[var(--marque-nuit)] m-0 mt-6 mb-3.5">
                  {p.titre}
                </h3>
                <p className="m-0 text-[15px] leading-[1.6] text-[#6b6b6b]">
                  {p.texte}
                </p>
              </article>
            ))}
          </div>

          {/*
            Le bouton du modèle, avec son halo rouge. Il ne mène nulle part
            pour l'instant : la lettre d'information n'existe pas encore —
            pas de liste d'abonnés, pas d'envoi, pas de désinscription. Le
            jour où elle existera, il aura sa destination.
          */}
          <div className="flex justify-center mt-9">
            <button
              type="button"
              className="btn-action shadow-[0_4px_24px_rgba(200,16,46,0.35)]"
            >
              S’inscrire à notre newsletter <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* ==================== Événements ==================== */}
      <section id="evenements" className="scroll-mt-[124px]">
        <div className={`${CONTENEUR} pt-10 pb-8`}>
          <div className="apparition-defilement overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)] p-5 md:p-10">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <span className="surtitre text-marque-rouge">
                  Rencontrons-nous
                </span>
                <h2 className="titre text-[clamp(28px,4vw,40px)] m-0 mt-2.5">
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
              <div className="mt-8">
                <CarrouselEvenements debord="-mx-5 px-5 scroll-px-5 md:mx-0 md:px-0 md:scroll-px-0">
                  {evenements.map((e, i) => (
                    <CarteEvenement key={e.id} evenement={e} index={i} />
                  ))}
                </CarrouselEvenements>
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
        <section id="actualites" className="scroll-mt-[124px]">
          <div className={`${CONTENEUR} pb-16`}>
            <div className="apparition-defilement">
              <span className="surtitre text-marque-vert">
                La vie de la chambre
              </span>
              <h2 className="titre text-[clamp(28px,4vw,40px)] m-0 mt-2.5">
                Les dernières <Saillant ton="vert">actualités</Saillant>
              </h2>
              <p className="text-[15px] text-muted m-0 mt-2.5">
                Ce qui se passe au sein du réseau CanCham.
              </p>
              <div className="grid gap-5 mt-8 md:grid-cols-2 lg:grid-cols-3">
                {actualites.map((a) => (
                  <CarteActualite key={a.id} actualite={a} />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ==================== Devenir membre ==================== */}
      {/*
        Une bande claire au bas d'une page sombre, comme sur cancham.mg : la
        page s'achève sur l'invitation, et le changement de fond la détache du
        reste. Les couleurs y sont écrites en clair — les jetons de la vitrine
        sont taillés pour le bleu nuit.
      */}
      <section className="bg-[#faf8f3] text-[var(--marque-nuit)]">
        <div className={`${CONTENEUR} py-16`}>
          <div className="apparition-defilement grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            {/* ---------- L'invitation ---------- */}
            <div>
              <span className="surtitre text-[#ad0707] inline-flex items-center gap-3">
                <span aria-hidden="true" className="w-8 h-px bg-[#ad0707]" />
                Rejoindre la communauté
              </span>
              <h2 className="font-[family-name:var(--font-texte)]! font-bold! text-[clamp(30px,4.2vw,54px)] leading-[1.05] tracking-[-0.015em] m-0 mt-3 mb-6">
                Devenir{" "}
                <span className="italic font-semibold text-[#ad0707]">
                  membre,
                </span>{" "}
                c’est entrer dans{" "}
                <span className="italic font-semibold text-[#007140]">
                  un cercle.
                </span>
              </h2>
              <p className="m-0 text-[18px] leading-[1.6] text-[#6b6b6b] max-w-[48ch]">
                Un cercle de dirigeants, d’entrepreneurs et d’institutions qui
                croient au pont entre le Canada et Madagascar. Et qui agissent.
              </p>

              <ul className="list-none m-0 mt-8 p-0">
                {AVANTAGES.map((a, i) => (
                  <li
                    key={a}
                    className="flex items-start gap-3.5 py-3.5 border-b border-black/10 text-[15px] leading-relaxed"
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
            <div className="carte-filet filet-fixe filet-degrade rounded-2xl bg-white p-8 md:p-12 shadow-[0_20px_60px_rgba(15,29,44,0.08)]">
              <span className="surtitre text-[#ad0707]">
                Choisissez votre formule
              </span>
              <h3 className="font-[family-name:var(--font-texte)]! font-bold! text-[30px] leading-[1.15] text-[var(--marque-nuit)] m-0 mt-2.5">
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
                  <li
                    key={f}
                    className="flex items-baseline justify-between gap-4 rounded-md bg-[#fafafa] px-[18px] py-4 text-[14px]"
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
    </>
  );
}
