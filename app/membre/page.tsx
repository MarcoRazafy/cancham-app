import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Lock,
  Mail,
  MapPin,
  Users,
} from "lucide-react";
import { AvatarRond, OfferCard } from "@/components/domain";
import { CarrouselOffres } from "@/components/membre/CarrouselOffres";
import { RegisterButton } from "@/components/forms/EventForms";
import { Card } from "@/components/ui";
import { fmtMoney, isPast, parseISO } from "@/lib/format";
import {
  ADHESION_PENDING,
  isOverdueWarning,
  joursDeRetard,
  retardBloque,
  RETARD_BLOCAGE_JOURS,
} from "@/lib/membership";
import {
  getEvents,
  getMember,
  getMembresAnnuaire,
  getOffers,
  getRegistrations,
  getStatsPubliques,
  getUnreadTotal,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { initialesDe, teinteDe } from "@/lib/avatars";

/** Vue d'ensemble de l'espace membre. */
export default async function VueDEnsemble() {
  const user = await getCurrentUser("membre");
  const membreOuNull = await getMember(user.memberId!);
  if (!membreOuNull) notFound();
  const me = membreOuNull;

  const [events, annuaire, inscriptions, stats, nonLus, offres] =
    await Promise.all([
      getEvents(),
      getMembresAnnuaire(),
      getRegistrations(me.id),
      getStatsPubliques(),
      getUnreadTotal(),
      getOffers(),
    ]);

  const aVenir = events.filter((e) => !isPast(e.date));
  const prochain = aVenir[0];
  const dejaInscrit = prochain
    ? inscriptions.some((r) => r.eventId === prochain.id)
    : false;

  // Trois entreprises à découvrir, la sienne exclue.
  const aDecouvrir = annuaire.filter((m) => m.id !== me.id).slice(0, 3);

  const enAttente = ADHESION_PENDING.includes(me.statut);
  const bloque = retardBloque(me);
  const enRetard = isOverdueWarning(me);

  return (
    <>
      {/* ==================== En-tête ==================== */}
      <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
        <div>
          <span className="surtitre text-faint">Votre réseau Canada–Madagascar</span>
          <h1 className="text-[clamp(28px,3.4vw,38px)] m-0 mt-2">
            Bonjour {user.nom.split(" ")[0]},
          </h1>
          <p className="text-[15px] text-muted m-0 mt-1.5">
            Des rencontres et des opportunités pour faire grandir vos projets.
          </p>
        </div>

        <Link
          href="/membre/annuaire"
          className="btn-action"
        >
          Explorer l’annuaire <ArrowRight size={16} />
        </Link>
      </div>

      {/* ==================== Bandeau d'adhésion ==================== */}
      <BandeauAdhesion
        statut={me.statut}
        enAttente={enAttente}
        bloque={bloque}
        enRetard={enRetard}
        jours={joursDeRetard(me)}
      />

      {/* ==================== Compteurs ==================== */}
      <div className="grid gap-4 mb-5 sm:grid-cols-2 lg:grid-cols-3">
        <Compteur
          icone={<Users size={26} />}
          valeur={stats.membres}
          libelle="Entreprises du réseau"
          href="/membre/annuaire"
          teinte="vert"
        />
        <Compteur
          icone={<CalendarDays size={26} />}
          valeur={aVenir.length}
          libelle="Événements à venir"
          href="/membre/evenements"
          teinte="rouge"
        />
        <Compteur
          icone={<Mail size={26} />}
          valeur={nonLus}
          libelle={`Message${nonLus > 1 ? "s" : ""} non lu${nonLus > 1 ? "s" : ""}`}
          href="/membre/messagerie"
          teinte="bleu"
        />
      </div>

      {/* ==================== Rendez-vous + annuaire ==================== */}
      <div className="grid gap-4 mb-5 lg:grid-cols-[1fr_360px] items-start">
        <Card className="carte-filet filet-degrade p-0">
          <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4">
            <h2 className="text-[19px] m-0">Votre prochain rendez-vous</h2>
            <Link
              href="/membre/evenements"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent no-underline hover:underline"
            >
              Tous les événements <ArrowRight size={14} />
            </Link>
          </div>

          {prochain ? (
            <>
              <div className="relative mx-6 rounded-xl overflow-hidden aspect-[16/7] bg-surface-2">
                {prochain.photo ? (
                  <Image
                    src={prochain.photo}
                    alt={prochain.titre}
                    fill
                    sizes="(max-width: 1024px) 100vw, 700px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="flex items-center gap-5 flex-wrap px-6 py-5">
                <PastilleDate date={prochain.date} />

                <div className="min-w-0 flex-1">
                  <h3 className="text-[18px] m-0 mb-2">{prochain.titre}</h3>
                  <div className="flex gap-4 flex-wrap text-[13px] text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={14} /> {prochain.lieu}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={14} /> {prochain.format}
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center text-[12px] font-semibold px-3 py-1.5 rounded-md bg-success-soft text-success-strong">
                  {prochain.payant ? fmtMoney(prochain.prix) : "Inclus"}
                </span>

                {dejaInscrit ? (
                  <Link
                    href={`/membre/evenements/${prochain.id}`}
                    className="btn-contour btn-contour-sm text-success hover:bg-success-soft"
                  >
                    <CheckCircle2 size={15} /> Inscrit
                  </Link>
                ) : (
                  <RegisterButton
                    event={prochain}
                    nom={user.nom}
                    email={user.email}
                    tel={user.tel}
                    libelle="M’inscrire"
                  />
                )}
              </div>
            </>
          ) : (
            <p className="px-6 pb-6 text-muted">Aucun rendez-vous programmé.</p>
          )}
        </Card>

        <Card className="carte-filet filet-vert p-6">
          <h2 className="text-[19px] m-0">Développez votre réseau</h2>
          <p className="text-[13.5px] text-muted m-0 mt-1 mb-4">
            Des entreprises à découvrir
          </p>

          <div className="flex flex-col">
            {aDecouvrir.map((m, i) => (
              <Link
                key={m.id}
                href={`/membre/annuaire/${m.id}`}
                className={`flex items-center gap-3.5 py-3.5 no-underline group ${
                  i < aDecouvrir.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <AvatarRond
                  src={m.photo}
                  alt={m.nom}
                  initiales={initialesDe(m.nom)}
                  taille={44}
                  className="text-[13px]"
                  style={teinteDe(m.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-semibold text-ink truncate">
                    {m.nom}
                  </span>
                  <span className="block text-[12.5px] text-muted truncate">
                    {m.secteur}
                  </span>
                </span>
                <ChevronRight
                  size={17}
                  className="text-faint shrink-0 group-hover:text-accent"
                />
              </Link>
            ))}
          </div>

          <p className="text-[12.5px] text-muted mt-4 mb-3">
            Trouvez des partenaires selon vos besoins.
          </p>
          <Link
            href="/membre/annuaire"
            className="btn-contour btn-contour-sm w-full text-accent hover:bg-accent-soft"
          >
            Ouvrir l’annuaire
          </Link>
        </Card>
      </div>

      {/* ==================== Offres & promotions membres ==================== */}
      <Card className="carte-filet filet-degrade p-6">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
          <div>
            <h2 className="text-[19px] m-0">Offres &amp; promotions membres</h2>
            <p className="text-[13.5px] text-muted m-0 mt-1">
              Les avantages que les adhérents se réservent entre eux
            </p>
          </div>
          <Link
            href="/membre/actualites"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent no-underline hover:underline"
          >
            Toutes les offres <ArrowRight size={14} />
          </Link>
        </div>

        <CarrouselOffres>
          {offres.map((o) => (
            <OfferCard key={o.id} offer={o} />
          ))}
        </CarrouselOffres>
      </Card>

    </>
  );
}

/* ============================ Blocs ============================ */

function BandeauAdhesion({
  enAttente,
  bloque,
  enRetard,
  jours,
}: {
  statut: string;
  enAttente: boolean;
  bloque: boolean;
  enRetard: boolean;
  jours: number;
}) {
  const alerte = enAttente || bloque || enRetard;

  const contenu = enAttente
    ? {
        icone: <Clock size={22} />,
        titre: "Cotisation à régler",
        texte:
          "L’accès complet à votre espace est activé dès le règlement de la cotisation.",
        pastille: "En attente",
      }
    : bloque
      ? {
          icone: <Lock size={22} />,
          titre: `Accès restreint — ${jours} jours de retard`,
          texte:
            "Régularisez votre cotisation pour retrouver l’ensemble de vos services.",
          pastille: "Restreint",
        }
      : enRetard
        ? {
            icone: <Clock size={22} />,
            titre: "Cotisation en retard",
            texte: `Régularisez avant ${RETARD_BLOCAGE_JOURS} jours de retard (${jours}/${RETARD_BLOCAGE_JOURS} écoulés).`,
            pastille: "À régulariser",
          }
        : {
            icone: <CheckCircle2 size={22} />,
            titre: "Votre adhésion est à jour",
            texte: "Vous bénéficiez de tous les services de votre espace membre.",
            pastille: "Membre actif",
          };

  return (
    <div
      className={`flex items-center gap-4 flex-wrap rounded-xl border-l-4 px-5 py-4 mb-5 ${
        alerte
          ? "bg-bad-soft border-l-bad border border-bad/25"
          : "bg-success-soft border-l-success border border-success/25"
      }`}
    >
      <span className={alerte ? "text-bad" : "text-success-strong"}>{contenu.icone}</span>

      <div className="min-w-0 flex-1">
        <div className="text-[15.5px] font-semibold text-ink">{contenu.titre}</div>
        <div className="text-[13.5px] text-muted mt-0.5">{contenu.texte}</div>
      </div>

      <span
        className={`text-[12.5px] font-semibold px-3.5 py-1.5 rounded-full ${
          alerte ? "bg-bad/20 text-bad" : "bg-success/20 text-success-strong"
        }`}
      >
        {contenu.pastille}
      </span>

      <Link
        href="/membre/cotisations"
        className="btn-contour btn-contour-sm border-line text-muted hover:bg-surface-2"
      >
        Voir ma cotisation
      </Link>
    </div>
  );
}

/** Chaque teinte accorde la tuile d'icône et le filet de survol de la carte. */
const TEINTES_COMPTEUR = {
  rouge: { tuile: "tuile-rouge", filet: "filet-rouge" },
  vert: { tuile: "tuile-verte", filet: "filet-vert" },
  bleu: { tuile: "tuile-bleue", filet: "filet-bleu" },
} as const;

function Compteur({
  icone,
  valeur,
  libelle,
  href,
  teinte,
}: {
  icone: React.ReactNode;
  valeur: number;
  libelle: string;
  href: string;
  /** Les trois couleurs de la chambre se répartissent sur la rangée. */
  teinte: keyof typeof TEINTES_COMPTEUR;
}) {
  return (
    <Link href={href} className="no-underline">
      <Card
        className={`tuile-hote carte-filet ${TEINTES_COMPTEUR[teinte].filet} p-5 flex items-center gap-4 transition-shadow hover:shadow-[0_10px_26px_-18px_rgba(15,29,44,0.4)]`}
      >
        <span className={`tuile ${TEINTES_COMPTEUR[teinte].tuile}`}>{icone}</span>
        <span>
          <span className="titre block text-[30px] leading-none text-ink">{valeur}</span>
          <span className="block text-[13.5px] text-muted mt-1.5">{libelle}</span>
        </span>
      </Card>
    </Link>
  );
}

function PastilleDate({ date }: { date: string }) {
  const d = parseISO(date);
  const mois = d
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  return (
    <span className="pastille w-[74px] shrink-0 rounded-xl bg-accent text-white text-center py-2.5">
      <span className="titre block text-[26px] leading-none">{d.getDate()}</span>
      <span className="block text-[10.5px] font-bold tracking-wider mt-1">{mois}</span>
    </span>
  );
}
