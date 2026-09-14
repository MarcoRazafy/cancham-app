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
import { EnTetePublique } from "@/components/public/Marque";
import { visuelEvenement } from "@/lib/images-publiques";
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
  const [e, prochains] = await Promise.all([getEvent(id), getProchainsEvenements(6)]);
  if (!e) notFound();

  const index = Math.max(0, prochains.findIndex((p) => p.id === e.id));
  const visuel = visuelEvenement(e.id, index);
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
          <div className="relative aspect-[21/8] rounded-xl overflow-hidden border border-white/12 mb-8">
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

            <p className="text-[16px] leading-[1.75] text-white/80 mt-7 max-w-[62ch]">
              {e.desc}
            </p>
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

            <Link
              href="/membre/evenements"
              className="w-full inline-flex items-center justify-center gap-2.5 font-[family-name:var(--font-titre)] font-bold text-[14px] px-5 py-3 rounded-lg bg-marque-rouge text-white no-underline hover:bg-[#c00d0d]"
            >
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

        {prochains.filter((p) => p.id !== e.id).length ? (
          <section className="mt-14 pt-10 border-t border-white/10">
            <h2 className="titre text-[22px] m-0 mb-5">
              Les autres rendez-vous
            </h2>
            <div className="grid gap-3">
              {prochains
                .filter((p) => p.id !== e.id)
                .slice(0, 4)
                .map((p) => (
                  <Link
                    key={p.id}
                    href={`/public/evenements/${p.id}`}
                    className="flex items-center justify-between gap-4 flex-wrap px-4 py-3.5 rounded-lg border border-white/10 hover:border-white/25 no-underline"
                  >
                    <span className="text-[14.5px] font-semibold text-white">
                      {p.titre}
                    </span>
                    <span className="text-[13px] text-white/55">
                      {fmtDate(p.date, { day: "numeric", month: "long" })} · {p.lieu}
                    </span>
                  </Link>
                ))}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
