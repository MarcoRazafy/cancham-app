import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  CalendarDays,
  ChevronRight,
  Clock,
  CreditCard,
  Lock,
  Newspaper,
} from "lucide-react";
import { EventRow, PhotoPlaceholder } from "@/components/domain";
import { Banner, BtnLink, Card, SectionTitle, Stat, StatusPill, ViewHead } from "@/components/ui";
import {
  getEvents,
  getInvoices,
  getMember,
  getNews,
  getOffers,
  getRegistrations,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { fmtDate, isPast } from "@/lib/format";
import {
  ADHESION_PENDING,
  isOverdueWarning,
  joursDeRetard,
  retardBloque,
  RETARD_BLOCAGE_JOURS,
} from "@/lib/membership";

export default async function AccueilMembre() {
  const user = await getCurrentUser("membre");
  const [membre, events, news, offers] = await Promise.all([
    getMember(user.memberId!),
    getEvents(),
    getNews(),
    getOffers(),
  ]);
  if (!membre) notFound();
  // Réaffectation en const déjà restreinte : le typage suit jusque dans les closures.
  const me = membre;

  const [myInvoices, mesInscriptions] = await Promise.all([
    getInvoices(me.id),
    getRegistrations(me.id),
  ]);

  const upcoming = events.filter((e) => !isPast(e.date)).slice(0, 3);
  const latestNews = news.slice(0, 3);

  const pending = ADHESION_PENDING.includes(me.statut);
  const blocked = retardBloque(me);
  const overdue = isOverdueWarning(me);

  const notifications = buildNotifications();

  function buildNotifications() {
    const list: { icon: React.ReactNode; titre: string; temps: string }[] = [];
    if (pending)
      list.push({
        icon: <CreditCard size={17} />,
        titre: "Cotisation à régler pour activer votre accès complet",
        temps: "À traiter",
      });
    if (me.statut === "en_retard")
      list.push({
        icon: <CreditCard size={17} />,
        titre: blocked
          ? `Cotisation en retard depuis plus de ${RETARD_BLOCAGE_JOURS} jours — accès restreint`
          : "Cotisation en retard — merci de régulariser",
        temps: "À traiter",
      });

    const nextReg = mesInscriptions
      .map((r) => events.find((e) => e.id === r.eventId))
      .filter((e): e is NonNullable<typeof e> => !!e && !isPast(e.date))
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (nextReg)
      list.push({
        icon: <CalendarDays size={17} />,
        titre: `Inscription confirmée : ${nextReg.titre}`,
        temps: fmtDate(nextReg.date, { day: "numeric", month: "short" }),
      });

    if (offers.length)
      list.push({
        icon: <Award size={17} />,
        titre: `Nouvelle offre membre : ${offers[0].titre}`,
        temps: "Cette semaine",
      });

    if (latestNews.length)
      list.push({
        icon: <Newspaper size={17} />,
        titre: `Nouvelle actualité : ${latestNews[0].titre}`,
        temps: fmtDate(latestNews[0].date, { day: "numeric", month: "short" }),
      });

    return list.slice(0, 4);
  }

  return (
    <>
      <ViewHead title={`Bonjour, ${user.nom.split(" ")[0]}`} action={<StatusPill status={me.statut} />}>
        Voici l’essentiel pour {me.nom} cette semaine : offres du moment, statut
        d’adhésion et vie de la communauté.
      </ViewHead>

      {pending ? (
        <div className="mb-5">
          <Banner
            tone="warn"
            icon={<Clock size={18} />}
            title="Adhésion en attente de paiement"
            action={
              <BtnLink href="/membre/profil" variant="primary" sm>
                <CreditCard size={13} /> Régulariser mon adhésion
              </BtnLink>
            }
          >
            Votre profil est actif mais l’accès complet (annuaire, événements,
            messagerie, actualités, ressources) est réservé aux membres à jour.
          </Banner>
        </div>
      ) : blocked ? (
        <div className="mb-5">
          <Banner
            tone="bad"
            icon={<Lock size={18} />}
            title={`Accès restreint — cotisation en retard depuis plus de ${RETARD_BLOCAGE_JOURS} jours`}
            action={
              <BtnLink href="/membre/profil" variant="primary" sm>
                <CreditCard size={13} /> Régulariser mon adhésion
              </BtnLink>
            }
          >
            Votre cotisation n’a pas été renouvelée depuis {joursDeRetard(me)} jours.
            L’accès aux autres sections a été automatiquement restreint.
          </Banner>
        </div>
      ) : overdue ? (
        <div className="mb-5">
          <Banner
            tone="bad"
            icon={<Clock size={18} />}
            title="Cotisation en retard"
            action={
              <BtnLink href="/membre/profil" variant="primary" sm>
                <CreditCard size={13} /> Régulariser mon adhésion
              </BtnLink>
            }
          >
            Merci de régulariser avant {RETARD_BLOCAGE_JOURS} jours de retard (
            {joursDeRetard(me)}/{RETARD_BLOCAGE_JOURS} jours écoulés), sans quoi votre
            accès sera automatiquement restreint.
          </Banner>
        </div>
      ) : null}

      {/* Offres membres en vedette */}
      <div
        className="rounded-[var(--radius-m)] overflow-hidden mb-[22px]"
        style={{
          background: "linear-gradient(135deg, var(--accent-strong), var(--accent))",
        }}
      >
        <div className="px-[22px] pt-5 pb-3.5 flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11.3px] font-bold px-2.5 py-[3px] rounded-full bg-white/20 text-white">
              <Award size={12} /> En vedette
            </span>
            <h2 className="m-0 text-[18px] text-white">Offres &amp; promotions membres</h2>
          </div>
          <Link
            href="/membre/actualites"
            className="inline-flex items-center gap-1.5 text-[12.4px] font-semibold px-[11px] py-1.5 rounded-[var(--radius-s)] bg-white text-accent-strong no-underline"
          >
            Voir toutes les offres <ChevronRight size={13} />
          </Link>
        </div>
        <div className="grid gap-3.5 px-[22px] pb-[22px] md:grid-cols-3">
          {offers.slice(0, 3).map((o) => (
            <div key={o.id} className="bg-surface rounded-[var(--radius-m)] overflow-hidden">
              <PhotoPlaceholder
                seed={o.id}
                className="h-[82px] w-full"
                icon={<Award size={20} />}
              />
              <div className="p-4">
                <span className="inline-flex text-[11.3px] font-bold px-2.5 py-[3px] rounded-full bg-surface-3 text-muted">
                  {o.membre}
                </span>
                <div className="font-bold text-[13.4px] mt-1.5 mb-1 leading-snug">
                  {o.titre}
                </div>
                <div className="text-xs text-muted leading-relaxed">{o.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 mb-[22px] md:grid-cols-3">
        <Stat
          k="Prochain événement"
          v={
            <span className="text-[22px]">
              {upcoming[0]
                ? fmtDate(upcoming[0].date, { day: "numeric", month: "short" })
                : "—"}
            </span>
          }
          d={upcoming[0]?.titre ?? "Aucun événement à venir"}
        />
        <Stat
          k="Factures"
          v={<span className="text-[22px]">{myInvoices.length}</span>}
          d="Voir mon profil pour le détail"
        />
        <Stat
          k="Notifications"
          v={<span className="text-[22px]">{notifications.length}</span>}
          d={notifications.length ? "À consulter ci-dessous" : "Rien de nouveau"}
        />
      </div>

      <div className="grid gap-4 items-start lg:grid-cols-2">
        <div>
          <SectionTitle>Notifications</SectionTitle>
          <Card className="mb-[22px] p-0 overflow-hidden">
            {notifications.map((n, i) => (
              <div
                key={n.titre}
                className={`flex items-center gap-3 px-3.5 py-3.5 ${
                  i < notifications.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <div className="w-[38px] h-[38px] rounded-[var(--radius-s)] bg-surface-2 flex items-center justify-center shrink-0 text-accent">
                  {n.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[13.2px]">{n.titre}</div>
                  <div className="text-[11.5px] text-faint">{n.temps}</div>
                </div>
              </div>
            ))}
          </Card>

          <SectionTitle>Événements à venir</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {upcoming.map((e) => (
              <EventRow
                key={e.id}
                event={e}
                href={`/membre/evenements/${e.id}`}
                registered={mesInscriptions.some((r) => r.eventId === e.id)}
              />
            ))}
          </div>
          <div className="mt-3">
            <BtnLink href="/membre/evenements" sm>
              Voir tous les événements <ChevronRight size={13} />
            </BtnLink>
          </div>
        </div>

        <div>
          <SectionTitle>Actualités récentes</SectionTitle>
          <Card className="p-0 overflow-hidden">
            {latestNews.map((n, i) => (
              <Link
                key={n.id}
                href={`/membre/actualites/${n.id}`}
                className={`flex items-center gap-3 px-3.5 py-3.5 no-underline hover:bg-surface-2 ${
                  i < latestNews.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <div className="w-[38px] h-[38px] rounded-[var(--radius-s)] bg-surface-2 flex items-center justify-center shrink-0 text-accent">
                  <Newspaper size={17} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[13.2px] truncate">{n.titre}</div>
                  <div className="text-[11.5px] text-faint">
                    {fmtDate(n.date, { day: "numeric", month: "short" })} · {n.cat}
                  </div>
                </div>
              </Link>
            ))}
          </Card>
          <div className="mt-3">
            <BtnLink href="/membre/actualites" sm>
              Toutes les actualités <ChevronRight size={13} />
            </BtnLink>
          </div>
        </div>
      </div>
    </>
  );
}
