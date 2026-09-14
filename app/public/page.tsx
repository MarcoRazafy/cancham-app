import Link from "next/link";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { Banner, BtnLink, Card, Pill, SectionTitle } from "@/components/ui";
import { getEvents, getMember, getMembresAnnuaire, getNews } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { fmtDate, isPast } from "@/lib/format";

export default async function PublicHome() {
  const visiteur = await getCurrentUser("public");
  const [candidature, membresVisibles, events, news] = await Promise.all([
    visiteur.memberId ? getMember(visiteur.memberId) : null,
    getMembresAnnuaire(),
    getEvents(),
    getNews(),
  ]);

  const secteurs = [...new Set(membresVisibles.map((m) => m.secteur))];
  const upcoming = events.filter((e) => !isPast(e.date)).slice(0, 3);
  const latest = news.slice(0, 3);

  return (
    <>
      <section className="mb-10">
        <h1 className="text-[30px] m-0 mb-3 max-w-[22ch]">
          Le réseau d’affaires entre le Canada et Madagascar
        </h1>
        <p className="text-muted text-[14.5px] leading-relaxed max-w-[62ch] m-0 mb-5">
          La Chambre de Commerce et de Coopération Canada–Madagascar réunit{" "}
          {membresVisibles.length} entreprises de {secteurs.length} secteurs. Missions
          économiques, mise en relation avec des acheteurs canadiens, accompagnement à
          l’export et événements de réseautage tout au long de l’année.
        </p>
        <BtnLink href="/public/adhesion" variant="primary">
          Déposer une demande d’adhésion
        </BtnLink>
      </section>

      {/* L'utilisateur de démonstration de cet espace : une candidature en cours. */}
      {candidature ? (
        <div className="mb-10">
          <Banner
            tone="warn"
            icon={<Clock size={18} />}
            title={`Votre demande pour ${candidature.nom} a bien été reçue`}
            action={
              <span className="text-[12.5px]">
                Suivi assuré par courriel à {visiteur.email}
              </span>
            }
          >
            Déposée le {fmtDate(candidature.adhesion)}, elle est en cours d’examen par
            l’équipe CanCham. L’accès à l’espace membre sera activé après validation et
            paiement de la cotisation.
          </Banner>
        </div>
      ) : null}

      <SectionTitle>Prochains événements</SectionTitle>
      <div className="grid gap-4 mb-10 md:grid-cols-3">
        {upcoming.map((e) => (
          <Card key={e.id} className="p-[18px]">
            <div className="flex items-center gap-1.5 text-[12px] text-accent font-semibold mb-2">
              <CalendarDays size={13} />
              {fmtDate(e.date)}
            </div>
            <h3 className="m-0 mb-2 text-[15px]">{e.titre}</h3>
            <div className="flex gap-3 flex-wrap text-[12.3px] text-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {e.lieu}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users size={12} /> {e.inscrits}/{e.cap}
              </span>
            </div>
            <div className="mt-3">
              <Pill>{e.payant ? "Payant" : "Gratuit"}</Pill>
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>Dernières actualités</SectionTitle>
      <div className="grid gap-4 md:grid-cols-3">
        {latest.map((n) => (
          <Card key={n.id} className="p-[18px] flex flex-col">
            <Pill className="self-start mb-2">{n.cat}</Pill>
            <h3 className="m-0 mb-2 text-[15px]">{n.titre}</h3>
            <p className="text-[12.8px] text-muted leading-relaxed m-0 flex-1 line-clamp-4">
              {n.extrait}
            </p>
            <div className="text-[11.5px] text-faint mt-3">{fmtDate(n.date)}</div>
          </Card>
        ))}
      </div>

      <p className="text-[11.5px] text-faint mt-8">
        L’annuaire complet, la messagerie et les ressources sont réservés aux membres.{" "}
        <Link href="/public/adhesion" className="text-accent">
          Rejoindre la chambre
        </Link>
        .
      </p>
    </>
  );
}
