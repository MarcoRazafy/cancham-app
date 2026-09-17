import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { CarrouselEvenements } from "@/components/public/CarrouselEvenements";
import { CarteEvenement } from "@/components/public/CarteEvenement";
import { visuelEvenement } from "@/lib/images-publiques";
import { Agrandir } from "@/components/Agrandir";
import { TexteLie } from "@/components/TexteLie";
import { plageHoraire } from "@/lib/agenda";
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
  const horaire = plageHoraire(e.debut, e.fin);

  return (
    <>
      <main className="max-w-[1120px] mx-auto px-5 py-10 w-full">
        <Link
          href="/public#evenements"
          className="inline-flex items-center gap-2 text-[13.5px] text-muted hover:text-ink no-underline mb-6"
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
            <div className="relative aspect-[16/9] md:aspect-[21/8] rounded-xl overflow-hidden border border-line bg-surface-3">
              <Image
                src={visuel.url}
                alt={visuel.alt}
                fill
                priority
                sizes="(max-width: 1120px) 100vw, 1080px"
                className="object-cover"
              />
            </div>
          </Agrandir>
        ) : null}

        {/*
          Sur téléphone, la participation vient juste après le titre : c'est
          la question qu'on se pose, pas une note à trouver sous la
          description. Sur ordinateur, elle reste à droite et suit le défilement.
        */}
        <div className="grid gap-x-10 gap-y-7 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
          <div className="lg:col-start-1 lg:row-start-1 min-w-0">
            <span className="surtitre text-marque-rouge">{e.format}</span>
            <h1 className="titre text-[clamp(28px,4vw,42px)] m-0 mt-2.5">
              {e.titre}
            </h1>

            <div className="flex gap-x-5 gap-y-2.5 flex-wrap text-[14px] text-muted mt-5">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} /> {fmtDate(e.date)}
              </span>
              {horaire ? (
                <span className="inline-flex items-center gap-2">
                  <Clock size={16} /> {horaire}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} /> {e.lieu}
              </span>
              <span className="inline-flex items-center gap-2">
                <Users size={16} /> {e.inscrits} inscrits sur {e.cap}
              </span>
            </div>
          </div>

          <aside className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24 rounded-xl border border-line bg-surface shadow-[var(--shadow)] p-6">
            <div className="surtitre text-faint">Participation</div>
            <div className="titre text-[30px] mt-1.5">
              {e.payant ? fmtMoney(e.prix) : "Gratuit"}
            </div>
            <p className="text-[13px] text-muted mt-1.5 mb-5">
              {restantes > 0
                ? `${restantes} place${restantes > 1 ? "s" : ""} restante${restantes > 1 ? "s" : ""}`
                : "Événement complet"}
            </p>

            <Link href="/membre/evenements" className="btn-action w-full">
              S’inscrire <ArrowRight size={16} />
            </Link>

            <p className="text-[12.5px] text-muted mt-3.5 mb-0">
              L’inscription est réservée aux membres à jour de cotisation.
            </p>

            <Link
              href="/public#adhesion"
              className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-line text-[13px] text-marque-vert font-semibold no-underline hover:underline"
            >
              Pas encore membre ? Rejoindre la chambre
              <ArrowRight size={15} className="shrink-0" />
            </Link>
          </aside>

          <div className="lg:col-start-1 lg:row-start-2 min-w-0">
            <div className="max-w-[62ch] flex flex-col gap-4">
              {e.desc.split("\n\n").map((para, i) => (
                <p
                  key={i}
                  className="m-0 text-[16px] leading-[1.75] text-[#33475b]"
                >
                  <TexteLie
                    texte={para}
                    classeLien="text-marque-vert underline underline-offset-2 decoration-marque-vert/40 hover:decoration-marque-vert [overflow-wrap:anywhere]"
                  />
                </p>
              ))}
            </div>

            {e.programme?.length ? (
              <div className="mt-10">
                <span className="surtitre text-marque-rouge">Au programme</span>
                <h2 className="titre text-[clamp(22px,2.6vw,28px)] m-0 mt-2 mb-5">
                  Le déroulé de la séance
                </h2>
                <ol className="list-none m-0 p-0 flex flex-col">
                  {e.programme.map((etape, i) => {
                    const derniere = i === e.programme!.length - 1;
                    return (
                      <li key={i} className="flex gap-4">
                        <div className="flex flex-col items-center shrink-0 w-[72px]">
                          <span className="text-[13px] font-bold text-marque-rouge whitespace-nowrap tabular-nums">
                            {etape.heure}
                          </span>
                          {derniere ? null : (
                            <span className="w-px flex-1 bg-line my-1.5" />
                          )}
                        </div>
                        <div className={`min-w-0 ${derniere ? "" : "pb-5"}`}>
                          <div className="text-[15px] font-semibold text-ink">
                            {etape.titre}
                          </div>
                          {etape.detail ? (
                            <p className="m-0 mt-1 text-[14px] text-muted leading-relaxed">
                              <TexteLie texte={etape.detail} />
                            </p>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : null}

            {e.pourQui ? (
              <div className="mt-10 rounded-xl border border-line bg-surface-2 px-5 py-4">
                <span className="surtitre text-marque-vert">Pour qui</span>
                <p className="m-0 mt-2 text-[15px] text-ink leading-relaxed">
                  <TexteLie texte={e.pourQui} />
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {autres.length ? (
          <section className="mt-14">
            <div className="overflow-hidden rounded-2xl border border-line bg-surface-2 p-5 md:p-8">
              <div className="flex items-end justify-between gap-6 flex-wrap mb-7">
                <div>
                  <span className="surtitre text-marque-rouge">
                    Ne manquez rien
                  </span>
                  <h2 className="titre text-[clamp(22px,3vw,30px)] m-0 mt-2">
                    Les autres rendez-vous
                  </h2>
                </div>
                <span className="text-[13px] text-faint">
                  {autres.length} à venir
                </span>
              </div>

              <CarrouselEvenements debord="-mx-5 px-5 scroll-px-5 md:mx-0 md:px-0 md:scroll-px-0">
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
