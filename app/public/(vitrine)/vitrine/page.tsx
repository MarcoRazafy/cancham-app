import Image from "next/image";
import { Saillant } from "@/components/ui";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, CalendarDays, FileText, Users } from "lucide-react";
import { CarrouselEvenements } from "@/components/public/CarrouselEvenements";
import { CarteEvenement } from "@/components/public/CarteEvenement";
import { Compteur } from "@/components/public/Compteur";
import { FormulaireAdhesion } from "@/components/public/FormulaireAdhesion";
import {
  fmtCotisation,
  libelleFormule,
  ORDRE_FORMULES,
} from "@/lib/membership";
import { VISUELS } from "@/lib/images-publiques";
import {
  getProchainsEvenements,
  getSecteurs,
  getStatsPubliques,
} from "@/lib/queries";

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
  const [stats, evenements, secteurs] = await Promise.all([
    getStatsPubliques(),
    getProchainsEvenements(8),
    getSecteurs(),
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

  const avantages = [
    { icone: Users, texte: "Développer votre réseau" },
    { icone: CalendarDays, texte: "Participer aux événements" },
    { icone: FileText, texte: "Accéder aux ressources et services" },
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

        <div className="relative max-w-[1120px] mx-auto px-5 pt-10 md:pt-14 pb-0">
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
                <Link href="#adhesion" className="btn-action">
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

      {/* ==================== Événements ==================== */}
      <section id="evenements" className="scroll-mt-24">
        <div className="max-w-[1120px] mx-auto px-5 pt-14 pb-8">
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

      {/* ==================== Adhésion ==================== */}
      <section id="adhesion" className="scroll-mt-24">
        <div className="max-w-[1120px] mx-auto px-5 pb-16">
          <div className="apparition-defilement rounded-2xl border border-line bg-surface shadow-[var(--shadow)] p-5 md:p-10">
            {/* `minmax(0, 1fr)` : sans cela, la liste des formules — un menu
                déroulant à libellés longs — élargit la colonne au-delà du
                cadre sur téléphone. */}
            <div className="grid gap-10 grid-cols-[minmax(0,1fr)] lg:grid-cols-2 items-start">
              <div className="min-w-0 lg:sticky lg:top-8">
                <span className="surtitre text-marque-vert">
                  Rejoignez CanCham
                </span>
                <h2 className="titre text-[clamp(26px,3.6vw,38px)] m-0 mt-2.5 max-w-[16ch]">
                  Votre prochain <Saillant ton="vert">partenariat</Saillant>{" "}
                  commence ici.
                </h2>
                <p className="text-[15px] text-muted m-0 mt-3.5 max-w-[44ch]">
                  Présentez votre entreprise et faites le premier pas vers le
                  réseau.
                </p>

                <ul className="list-none p-0 mt-8 mb-0 flex flex-col gap-5">
                  {avantages.map((a) => {
                    const Icone = a.icone;
                    return (
                      <li key={a.texte} className="flex items-center gap-4">
                        <span className="shrink-0 w-11 h-11 rounded-full bg-success-soft text-marque-vert flex items-center justify-center">
                          <Icone size={19} />
                        </span>
                        <span className="text-[15px] text-ink">{a.texte}</span>
                      </li>
                    );
                  })}
                </ul>

                {/* Les tarifs, sous les yeux pendant qu'on remplit le formulaire. */}
                <div className="mt-8 rounded-xl border border-line bg-surface-2 px-5 py-4">
                  <div className="surtitre text-faint mb-2">
                    Cotisation annuelle
                  </div>
                  <ul className="list-none m-0 p-0">
                    {ORDRE_FORMULES.map((f) => (
                      <li
                        key={f}
                        className="flex items-baseline justify-between gap-4 py-2 border-b border-line last:border-b-0 text-[13.5px]"
                      >
                        <span className="text-muted min-w-0">
                          {libelleFormule(f)}
                        </span>
                        <span className="text-ink font-semibold whitespace-nowrap tabular-nums">
                          {fmtCotisation(f)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-[13px] text-muted mt-6 mb-0">
                  Votre candidature sera examinée par l’équipe CanCham. Besoin
                  d’un dossier complet ?{" "}
                  <Link
                    href="/public/inscription"
                    className="text-marque-vert font-semibold underline underline-offset-2"
                  >
                    Formulaire détaillé
                  </Link>
                  .
                </p>
              </div>

              <div className="min-w-0">
                <FormulaireAdhesion secteurs={secteurs} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
