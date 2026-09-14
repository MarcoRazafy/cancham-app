import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, FileText, Users } from "lucide-react";
import { CarteEvenement } from "@/components/public/CarteEvenement";
import { FormulaireAdhesion } from "@/components/public/FormulaireAdhesion";
import { LogoOfficiel } from "@/components/public/Marque";
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
  const [stats, evenements, secteurs] = await Promise.all([
    getStatsPubliques(),
    getProchainsEvenements(3),
    getSecteurs(),
  ]);

  const chiffres = [
    { valeur: "10 ans", libelle: "de coopération" },
    {
      valeur: `${stats.membres}`,
      libelle: `entreprise${stats.membres > 1 ? "s" : ""} dans le réseau`,
    },
    {
      valeur: `${stats.secteurs}`,
      libelle: `secteur${stats.secteurs > 1 ? "s" : ""} représentés`,
    },
    { valeur: "2 pays", libelle: "une ambition commune" },
  ];

  const avantages = [
    { icone: Users, texte: "Développer votre réseau" },
    { icone: CalendarDays, texte: "Participer aux événements" },
    { icone: FileText, texte: "Accéder aux ressources et services" },
  ];

  return (
    <>
      {/* ==================== Bannière ==================== */}
      <section className="relative overflow-hidden">
        {/* Toronto à gauche, Madagascar à droite : les deux pays encadrent la
            bannière, le dégradé rouge → vert de la charte fait la jonction. */}
        <div className="absolute inset-0" aria-hidden="true">
          {VISUELS.toronto.url ? (
            <div className="absolute inset-y-0 left-0 w-1/2 md:w-[38%]">
              <Image
                src={VISUELS.toronto.url}
                alt=""
                fill
                priority
                sizes="50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-r from-[#ad0707]/55 to-[var(--marque-nuit)]" />
            </div>
          ) : null}

          {VISUELS.madagascar.url ? (
            <div className="absolute inset-y-0 right-0 w-1/2 md:w-[32%]">
              <Image
                src={VISUELS.madagascar.url}
                alt=""
                fill
                sizes="50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-l from-[#007140]/55 to-[var(--marque-nuit)]" />
            </div>
          ) : null}

          <div className="absolute inset-0 bg-[var(--marque-nuit)]/55" />
        </div>

        <div className="relative max-w-[1120px] mx-auto px-5 pt-8 pb-0">
          <Link href="/public" aria-label="CanCham Connect">
            <LogoOfficiel className="w-[240px] md:w-[300px] h-auto" priority />
          </Link>

          <div className="grid gap-9 lg:grid-cols-[1fr_minmax(0,540px)] items-center mt-9">
            <div>
              <span className="surtitre inline-block px-3.5 py-1.5 rounded-full border border-white/30 text-white/85">
                Le réseau Canada–Madagascar
              </span>

              <h1 className="text-[clamp(38px,6vw,62px)] font-extrabold leading-[1.04] m-0 mt-5">
                Deux pays.
                <br />
                Un réseau.
                <br />
                Des <span className="text-[#3fc98a]">opportunités.</span>
              </h1>

              <p className="text-[16px] leading-relaxed text-white/80 max-w-[46ch] mt-5 mb-0">
                Rencontrez des entreprises, développez vos partenariats et donnez une
                nouvelle dimension à vos projets.
              </p>

              <div className="flex gap-3 flex-wrap mt-7">
                <Link
                  href="#adhesion"
                  className="inline-flex items-center gap-2.5 font-[family-name:var(--font-titre)] font-bold text-[14.5px] px-6 py-3.5 rounded-lg bg-marque-rouge text-white no-underline transition-colors hover:bg-[#c00d0d]"
                >
                  Devenir membre <ArrowRight size={17} />
                </Link>
                <Link
                  href="#evenements"
                  className="inline-flex items-center font-[family-name:var(--font-titre)] font-bold text-[14.5px] px-6 py-3.5 rounded-lg border border-white/35 text-white no-underline transition-colors hover:bg-white/10"
                >
                  Voir les événements
                </Link>
              </div>
            </div>

            {VISUELS.hero.url ? (
              <figure className="relative m-0 rounded-xl overflow-hidden border border-white/15 aspect-[16/11]">
                <Image
                  src={VISUELS.hero.url}
                  alt={VISUELS.hero.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 540px"
                  className="object-cover"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-4 pt-10 pb-3.5 text-[13px] text-white/90">
                  Des échanges qui font grandir vos projets
                </figcaption>
              </figure>
            ) : null}
          </div>

          {/* ==================== Chiffres ==================== */}
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-y-7 mt-12 mb-0 pb-11 border-t border-white/12 pt-9">
            {chiffres.map((c, i) => (
              <div
                key={c.libelle}
                className={`text-center px-3 ${
                  i > 0 ? "md:border-l md:border-white/12" : ""
                }`}
              >
                <dt className="titre text-[clamp(26px,3.4vw,34px)] font-extrabold text-white">
                  {c.valeur}
                </dt>
                <dd className="m-0 text-[13px] text-white/60">{c.libelle}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ==================== Événements ==================== */}
      <section
        id="evenements"
        className="scroll-mt-6 bg-[var(--marque-nuit)] border-t border-white/10"
      >
        <div className="max-w-[1120px] mx-auto px-5 py-16">
          <span className="surtitre text-white/45">Rencontrons-nous</span>
          <h2 className="titre text-[clamp(28px,4vw,40px)] font-extrabold m-0 mt-2.5">
            Les prochains rendez-vous
          </h2>
          <p className="text-[15px] text-white/65 m-0 mt-2.5">
            Des rencontres pour apprendre, échanger et créer des liens.
          </p>

          {evenements.length ? (
            <div className="grid gap-5 mt-8 md:grid-cols-2 lg:grid-cols-3">
              {evenements.map((e, i) => (
                <CarteEvenement key={e.id} evenement={e} index={i} />
              ))}
            </div>
          ) : (
            <p className="text-white/60 mt-8">
              Aucun rendez-vous programmé pour le moment.
            </p>
          )}
        </div>
      </section>

      {/* ==================== Adhésion ==================== */}
      <section id="adhesion" className="scroll-mt-6">
        <div className="max-w-[1120px] mx-auto px-5 pb-16">
          <div className="rounded-2xl border border-white/12 bg-[var(--marque-nuit-2)] p-6 md:p-10">
            <div className="grid gap-10 lg:grid-cols-2 items-start">
              <div>
                <span className="surtitre text-white/45">Rejoignez CanCham</span>
                <h2 className="titre text-[clamp(26px,3.6vw,38px)] font-extrabold m-0 mt-2.5 max-w-[16ch]">
                  Votre prochain partenariat commence ici.
                </h2>
                <p className="text-[15px] text-white/70 m-0 mt-3.5 max-w-[44ch]">
                  Présentez votre entreprise et faites le premier pas vers le réseau.
                </p>

                <ul className="list-none p-0 mt-8 mb-0 flex flex-col gap-5">
                  {avantages.map((a) => {
                    const Icone = a.icone;
                    return (
                      <li key={a.texte} className="flex items-center gap-4">
                        <span className="shrink-0 w-11 h-11 rounded-full border border-marque-vert/50 text-marque-vert flex items-center justify-center">
                          <Icone size={19} />
                        </span>
                        <span className="text-[15px] text-white/90">{a.texte}</span>
                      </li>
                    );
                  })}
                </ul>

                <p className="text-[13px] text-white/50 mt-8 pt-6 border-t border-white/10 mb-0">
                  Votre candidature sera examinée par l’équipe CanCham. Besoin d’un
                  dossier complet ?{" "}
                  <Link
                    href="/public/adhesion"
                    className="text-white/80 underline underline-offset-2"
                  >
                    Formulaire détaillé
                  </Link>
                  .
                </p>
              </div>

              <FormulaireAdhesion secteurs={secteurs} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
