import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCheck,
  Clock,
  CreditCard,
  Headset,
  MapPin,
  Users,
} from "lucide-react";
import { EventCard, Visuel } from "@/components/domain";
import { Banner, BtnLink, Card, Kicker, Stat } from "@/components/ui";
import {
  CancelRegistrationButton,
  RegisterButton,
} from "@/components/forms/EventForms";
import {
  getEntreprisesInscrites,
  getEvent,
  getEvents,
  getRegistration,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { fmtDate, fmtMoney, isPast } from "@/lib/format";

export default async function EvenementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const e = await getEvent(id);
  if (!e) notFound();

  const user = await getCurrentUser("membre");
  const [reg, entreprises, tous] = await Promise.all([
    getRegistration(e.id, user.memberId),
    getEntreprisesInscrites(e.id),
    getEvents(),
  ]);

  const past = isPast(e.date);
  const restantes = e.cap - e.inscrits;
  const remplissage = Math.min(100, Math.round((e.inscrits / e.cap) * 100));

  // Les trois prochains rendez-vous, celui-ci mis à part.
  const autres = tous.filter((a) => a.id !== e.id && !isPast(a.date)).slice(0, 3);

  return (
    <>
      <div className="mb-4">
        <BtnLink href="/membre/evenements" variant="ghost" sm>
          <ArrowLeft size={14} /> Retour aux événements
        </BtnLink>
      </div>

      {/* ==================== Bandeau ==================== */}
      <div className="relative rounded-[var(--radius-l)] overflow-hidden mb-4">
        <Visuel
          src={e.photo}
          alt={e.titre}
          seed={e.id}
          className="h-[300px] w-full"
          sizes="(max-width: 1024px) 100vw, 1000px"
          icon={<CalendarDays size={34} />}
        />
        {/* Le dégradé garantit la lisibilité du titre quelle que soit la photo. */}
        <div className="absolute inset-0 bg-linear-to-t from-[#0f1d2c]/90 via-[#0f1d2c]/35 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-[0.09em] px-2.5 py-1 rounded-md bg-white/15 text-white backdrop-blur-sm">
              {e.format}
            </span>
            {past ? (
              <span className="text-[11px] font-bold uppercase tracking-[0.09em] px-2.5 py-1 rounded-md bg-white/15 text-white backdrop-blur-sm">
                Déjà passé
              </span>
            ) : null}
          </div>
          <h1 className="m-0 text-white text-[30px] leading-[1.15] drop-shadow-sm">
            {e.titre}
          </h1>
          <div className="flex gap-4 flex-wrap text-[13.4px] text-white/85">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} /> {fmtDate(e.date)}
            </span>
            {e.heure ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={15} /> {e.heure}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} /> {e.lieu}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 items-start lg:grid-cols-3">
        {/* ==================== Colonne principale ==================== */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="carte-filet filet-degrade p-[22px]">
            <Kicker>À propos</Kicker>
            <div className="mt-2.5 flex flex-col gap-3.5 text-muted text-[14.3px] leading-[1.75]">
              {e.desc.split("\n\n").map((para, i) => (
                <p key={i} className="m-0">
                  {para}
                </p>
              ))}
            </div>
          </Card>

          {e.programme && e.programme.length > 0 ? (
            <Card className="carte-filet filet-rouge p-[22px]">
              <Kicker>Au programme</Kicker>
              <h2 className="mt-1.5 mb-4 text-[19px]">Le déroulé de la séance</h2>
              <ol className="list-none m-0 p-0 flex flex-col">
                {e.programme.map((etape, i) => (
                  <li key={i} className="flex gap-4">
                    {/* Colonne de gauche : l'heure, puis le filet qui relie les étapes. */}
                    <div className="flex flex-col items-center shrink-0 w-[68px]">
                      <span className="font-[family-name:var(--font-mono)] text-[12.4px] font-bold text-accent-strong whitespace-nowrap">
                        {etape.heure}
                      </span>
                      {i < e.programme!.length - 1 ? (
                        <span className="w-px flex-1 bg-line my-1.5" />
                      ) : null}
                    </div>
                    <div className={i < e.programme!.length - 1 ? "pb-5" : ""}>
                      <div className="text-[14.5px] font-semibold text-ink">
                        {etape.titre}
                      </div>
                      {etape.detail ? (
                        <p className="m-0 mt-1 text-[13px] text-muted leading-relaxed">
                          {etape.detail}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}

          {e.pourQui ? (
            <Card className="carte-filet filet-vert p-[22px]">
              <Kicker>Public visé</Kicker>
              <h2 className="mt-1.5 mb-2 text-[19px]">
                À qui s’adresse ce rendez-vous
              </h2>
              <p className="m-0 text-muted text-[14px] leading-relaxed">
                {e.pourQui}
              </p>
            </Card>
          ) : null}

          {entreprises.noms.length > 0 ? (
            <Card className="carte-filet filet-bleu p-[22px]">
              <Kicker>Déjà inscrits</Kicker>
              <h2 className="mt-1.5 mb-1 text-[19px]">
                {past ? "Qui était dans la salle" : "Qui sera dans la salle"}
              </h2>
              <p className="m-0 mb-4 text-[13.3px] text-muted">
                {entreprises.total} entreprise{entreprises.total > 1 ? "s" : ""}{" "}
                représentée{entreprises.total > 1 ? "s" : ""}, pour {e.inscrits}{" "}
                participant{e.inscrits > 1 ? "s" : ""} inscrit
                {e.inscrits > 1 ? "s" : ""}.
              </p>
              <div className="flex flex-wrap gap-2">
                {entreprises.noms.map((nom) => (
                  <span
                    key={nom}
                    className="inline-flex items-center gap-1.5 text-[12.6px] font-medium px-3 py-1.5 rounded-full bg-surface-2 text-ink border border-line"
                  >
                    <Building2 size={13} className="text-faint shrink-0" />
                    {nom}
                  </span>
                ))}
                {entreprises.total > entreprises.noms.length ? (
                  <span className="inline-flex items-center text-[12.6px] font-semibold px-3 py-1.5 rounded-full bg-accent-soft text-accent-strong">
                    + {entreprises.total - entreprises.noms.length} autres
                  </span>
                ) : null}
              </div>
            </Card>
          ) : null}
        </div>

        {/* ==================== Colonne latérale ==================== */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-4">
          <Card className="p-[22px]">
            <div className="flex flex-col gap-1.5 mb-3.5">
              <div className="text-[11.5px] uppercase tracking-[0.08em] text-faint font-semibold">
                Tarif
              </div>
              <div className="font-[family-name:var(--font-display)] text-[22px] font-semibold">
                {e.payant ? fmtMoney(e.prix) : "Gratuit"}
              </div>
              <div className="text-xs text-muted">
                {e.payant ? "Réglable sur place" : "Ouvert à tous les membres"}
              </div>
            </div>

            {past ? (
              <div className="text-xs text-muted">
                Cet événement a déjà eu lieu le {fmtDate(e.date)}.
              </div>
            ) : reg ? (
              <>
                <Banner
                  tone="ok"
                  icon={<CheckCheck size={18} />}
                  title="Inscription confirmée"
                >
                  Code {reg.code}
                </Banner>
                <div className="mt-3.5">
                  <CancelRegistrationButton eventId={e.id} />
                </div>
                <div className="mt-3.5 p-4 bg-surface-2 rounded-[var(--radius-m)] flex flex-col items-center gap-2.5">
                  <div className="bg-white p-2.5 rounded-lg border border-line">
                    <QrPlaceholder code={reg.code} />
                  </div>
                  <div className="font-[family-name:var(--font-mono)] text-[13px] font-bold tracking-wide">
                    {reg.code}
                  </div>
                  <div className="text-[11.5px] text-faint text-center">
                    Présentez ce code à l’accueil pour l’enregistrement
                  </div>
                </div>
              </>
            ) : (
              <>
                <Stat k="Places restantes" v={restantes} />
                {/* La jauge dit d'un coup d'œil s'il est urgent de s'inscrire. */}
                <div className="mt-3">
                  <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${remplissage}%` }}
                    />
                  </div>
                  <div className="mt-1.5 text-[11.8px] text-faint">
                    {e.inscrits} inscrits sur {e.cap} places — {remplissage} %
                  </div>
                </div>
                <div className="mt-3.5">
                  {restantes > 0 ? (
                    <RegisterButton
                      event={e}
                      libelle="S’inscrire"
                      nom={user.nom}
                      email={user.email}
                      tel={user.tel}
                    />
                  ) : (
                    <p className="text-[13px] text-muted m-0 text-center">
                      Événement complet.
                    </p>
                  )}
                </div>
              </>
            )}
          </Card>

          <Card className="p-[22px]">
            <Kicker>Infos pratiques</Kicker>
            <dl className="m-0 mt-3 flex flex-col">
              <Pratique icone={<CalendarDays size={15} />} cle="Date">
                {fmtDate(e.date)}
              </Pratique>
              {e.heure ? (
                <Pratique icone={<Clock size={15} />} cle="Horaire">
                  {e.heure}
                </Pratique>
              ) : null}
              <Pratique icone={<MapPin size={15} />} cle="Lieu">
                {e.lieu}
              </Pratique>
              <Pratique icone={<Users size={15} />} cle="Capacité">
                {e.cap} places
              </Pratique>
              <Pratique icone={<CreditCard size={15} />} cle="Participation">
                {e.payant ? fmtMoney(e.prix) : "Gratuit"}
              </Pratique>
            </dl>
          </Card>

          <Card className="tuile-hote carte-filet filet-vert p-[22px] flex gap-3.5">
            <span className="tuile tuile-sm tuile-verte">
              <Headset size={20} />
            </span>
            <div className="min-w-0">
              <div className="text-[14.5px] font-semibold text-ink">
                Une question ?
              </div>
              <p className="m-0 mt-1 text-[12.8px] text-muted leading-relaxed">
                L’équipe de la chambre répond sur l’organisation, l’accès et les
                modalités de règlement.
              </p>
              <Link
                href="/membre/messagerie"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent no-underline mt-2.5 hover:underline"
              >
                Écrire à l’équipe <ArrowRight size={14} />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* ==================== Autres rendez-vous ==================== */}
      {autres.length > 0 ? (
        <section className="mt-7">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
            <div>
              <Kicker>Et ensuite</Kicker>
              <h2 className="mt-1 mb-0 text-[20px]">Autres rendez-vous à venir</h2>
            </div>
            <Link
              href="/membre/evenements"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent no-underline hover:underline"
            >
              Tout l’agenda <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {autres.map((a) => (
              <EventCard
                key={a.id}
                event={a}
                href={`/membre/evenements/${a.id}`}
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

/** Une ligne du bloc « Infos pratiques ». */
function Pratique({
  icone,
  cle,
  children,
}: {
  icone: React.ReactNode;
  cle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-line last:border-b-0">
      <span className="text-faint shrink-0 mt-px">{icone}</span>
      <dt className="text-[12.8px] text-muted w-[92px] shrink-0">{cle}</dt>
      <dd className="m-0 text-[13.2px] font-semibold text-ink min-w-0">
        {children}
      </dd>
    </div>
  );
}

/**
 * Aperçu de QR non fonctionnel.
 *
 * Le prototype dessinait un motif aléatoire en canvas, qui n'encodait rien. On
 * garde ici la même honnêteté visuelle : c'est un placeholder, pas un vrai code.
 * Le passage à `qrcode.react` viendra avec le check-in réel.
 */
function QrPlaceholder({ code }: { code: string }) {
  const size = 21;
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  const next = () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 4294967295;
  };
  const cells: boolean[] = [];
  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = Math.floor(i / size);
    const finder =
      (x < 7 && y < 7) || (x > size - 8 && y < 7) || (x < 7 && y > size - 8);
    cells.push(finder ? false : next() > 0.56);
  }
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: `repeat(${size}, 6px)`, width: size * 6 }}
      aria-label={`Aperçu du code ${code}`}
    >
      {cells.map((on, i) => (
        <div key={i} style={{ width: 6, height: 6, background: on ? "#0F1D2C" : "#fff" }} />
      ))}
    </div>
  );
}
