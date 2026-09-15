import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Users,
} from "lucide-react";
import { CarrouselEvenements } from "@/components/public/CarrouselEvenements";
import { CarteEvenement } from "@/components/public/CarteEvenement";
import { EnTetePublique } from "@/components/public/Marque";
import { visuelEvenement } from "@/lib/images-publiques";
import { Agrandir } from "@/components/Agrandir";
import { fmtDate, fmtMoney } from "@/lib/format";
import { getEvent, getProchainsEvenements } from "@/lib/queries";

/**
 * Fiche publique d'un événement.
 *
 * Visible sans compte : c'est une porte d'entrée vers l'adhésion. L'inscription
 * elle-même reste réservée aux membres, la page y renvoie explicitement.
 */
export default async function EvenementPublic({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [e, prochains] = await Promise.all([
    getEvent(id),
    getProchainsEvenements(8),
  ]);
  if (!e) notFound();

  const index = Math.max(
    0,
    prochains.findIndex((p) => p.id === e.id),
  );

  /**
   * Les autres rendez-vous, chacun accompagné de son rang d'origine : le visuel
   * d'un événement est choisi à partir de ce rang, il doit donc rester le même
   * ici que sur la page d'accueil.
   */
  const autres = prochains
    .map((evenement, rang) => ({ evenement, rang }))
    .filter(({ evenement }) => evenement.id !== e.id);
  const visuel = e.photo
    ? { url: e.photo, alt: "" }
    : visuelEvenement(e.id, index);
  const restantes = Math.max(0, e.cap - e.inscrits);

  return (
    <>
      <EnTetePublique />

      <main className="max-w-[1120px] mx-auto px-5 py-10 w-full">
        <Link
          href="/public#evenements"
          className="inline-flex items-center gap-2 text-[13.5px] text-white/60 hover:text-white no-underline mb-6"
        >
          <ArrowLeft size={15} /> Tous les rendez-vous
        </Link>

        {visuel ? (
          <Agrandir
            src={visuel.url}
            alt={e.titre}
            legende={e.titre}
            className="mb-8"
          >
            <div className="relative aspect-[21/8] rounded-xl overflow-hidden border border-white/12">
              <Image
                src={visuel.url}
                alt={visuel.alt}
                fill
                priority
                sizes="(max-width: 1120px) 100vw, 1080px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[var(--marque-nuit)]/85 to-transparent" />
            </div>
          </Agrandir>
        ) : null}

        <div className="grid gap-9 lg:grid-cols-[1fr_320px] items-start">
          <div>
            <span className="surtitre text-white/45">{e.format}</span>
            <h1 className="titre text-[clamp(28px,4vw,42px)] m-0 mt-2.5">
              {e.titre}
            </h1>

            <div className="flex gap-5 flex-wrap text-[14px] text-white/70 mt-5">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} /> {fmtDate(e.date)}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} /> {e.lieu}
              </span>
              <span className="inline-flex items-center gap-2">
                <Users size={16} /> {e.inscrits} inscrits sur {e.cap}
              </span>
            </div>

            <div className="mt-7 max-w-[62ch] flex flex-col gap-4">
              {e.desc.split("\n\n").map((para, i) => (
                <p
                  key={i}
                  className="m-0 text-[16px] leading-[1.75] text-white/80"
                >
                  {para}
                </p>
              ))}
            </div>
          </div>

          <aside className="rounded-xl border border-white/12 bg-white/[0.03] p-6">
            <div className="surtitre text-white/45">Participation</div>
            <div className="titre text-[30px] mt-1.5">
              {e.payant ? fmtMoney(e.prix) : "Gratuit"}
            </div>
            <p className="text-[13px] text-white/60 mt-1.5 mb-5">
              {restantes > 0
                ? `${restantes} place${restantes > 1 ? "s" : ""} restante${restantes > 1 ? "s" : ""}`
                : "Événement complet"}
            </p>

            <Link href="/membre/evenements" className="btn-action w-full">
              S’inscrire <ArrowRight size={16} />
            </Link>

            <p className="text-[12.5px] text-white/50 mt-3.5 mb-0">
              L’inscription est réservée aux membres à jour de cotisation.
            </p>

            <Link
              href="/public#adhesion"
              className="block mt-4 pt-4 border-t border-white/10 text-[13px] text-marque-vert font-semibold no-underline"
            >
              Pas encore membre ? Rejoindre la chambre
            </Link>
          </aside>
        </div>

        {autres.length ? (
          <section className="mt-14">
            <div className="rounded-2xl border border-white/12 bg-[var(--marque-nuit-2)] p-6 md:p-8">
              <div className="flex items-end justify-between gap-6 flex-wrap mb-7">
                <div>
                  <span className="surtitre text-white/45">
                    Ne manquez rien
                  </span>
                  <h2 className="titre text-[clamp(22px,3vw,30px)] m-0 mt-2">
                    Les autres rendez-vous
                  </h2>
                </div>
                <span className="text-[13px] text-white/45">
                  {autres.length} à venir
                </span>
              </div>

              <CarrouselEvenements>
                {autres.map(({ evenement, rang }) => (
                  <CarteEvenement
                    key={evenement.id}
                    evenement={evenement}
                    index={rang}
                  />
                ))}
              </CarrouselEvenements>
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
