import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Download,
  ExternalLink,
  MapPin,
  Pencil,
  Search,
  Ticket,
  UserCheck,
  UserRound,
  UserX,
  Users,
} from "lucide-react";
import { Compteur, Jauge, Onglets, Panneau, Vide } from "@/components/admin/ui";
import {
  AddAttendeeButton,
  AttendanceButton,
  DeleteEventButton,
  RetirerParticipantButton,
} from "@/components/forms/EventForms";
import { TexteLie } from "@/components/TexteLie";
import { Card, Pill } from "@/components/ui";
import { fmtDate, fmtMoney, isPast } from "@/lib/format";
import { getEvent, getMembers } from "@/lib/queries";
import { getParticipants } from "@/lib/queries-admin";
import { plat } from "@/lib/texte";

const ONGLETS = [
  { cle: "tous", libelle: "Tous" },
  { cle: "attendus", libelle: "À accueillir" },
  { cle: "presents", libelle: "Présents" },
  { cle: "absents", libelle: "Absents" },
] as const;

const STATUT_ONGLET = {
  attendus: "confirme",
  presents: "present",
  absents: "absent",
} as const;

const PASTILLES = {
  confirme: { ton: "warn", libelle: "Inscrit" },
  present: { ton: "ok", libelle: "Présent" },
  absent: { ton: "bad", libelle: "Absent" },
} as const;

export default async function EvenementAdmin({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ onglet?: string; q?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const e = await getEvent(id);
  if (!e) notFound();

  const [participants, membres] = await Promise.all([
    getParticipants(id),
    getMembers(),
  ]);

  const onglet = ONGLETS.some((o) => o.cle === sp.onglet)
    ? (sp.onglet as (typeof ONGLETS)[number]["cle"])
    : "tous";
  const recherche = sp.q?.trim() ?? "";
  const passe = isPast(e.date);

  const trouves = recherche
    ? participants.filter((p) =>
        plat(`${p.nom} ${p.entreprise} ${p.email}`).includes(plat(recherche)),
      )
    : participants;
  const liste =
    onglet === "tous"
      ? trouves
      : trouves.filter((p) => p.statut === STATUT_ONGLET[onglet]);

  const compte = (s: "confirme" | "present" | "absent") =>
    participants.filter((p) => p.statut === s).length;
  const presents = compte("present");
  const restantes = Math.max(0, e.cap - participants.length);

  const lien = (o: string) => {
    const p = new URLSearchParams();
    if (o !== "tous") p.set("onglet", o);
    if (recherche) p.set("q", recherche);
    const qs = p.toString();
    return `/admin/evenements/${id}${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <Link
        href="/admin/evenements"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted no-underline hover:text-accent mb-4"
      >
        <ArrowLeft size={14} /> Tous les événements
      </Link>

      {/* ==================== En-tête ==================== */}
      <Card className="p-0 overflow-hidden mb-5">
        <div className="grid md:grid-cols-[320px_1fr]">
          <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[210px] bg-surface-2">
            {e.photo ? (
              <Image
                src={e.photo}
                alt={e.titre}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-faint">
                <CalendarDays size={32} />
              </span>
            )}
          </div>
          <div className="p-6 flex flex-col gap-3 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Pill tone={passe ? "muted" : "ok"}>
                {passe ? "Passé" : "À venir"}
              </Pill>
              <Pill>{e.format}</Pill>
              <Pill tone={e.payant ? "warn" : "ok"}>
                {e.payant ? fmtMoney(e.prix) : "Inclus"}
              </Pill>
            </div>
            <h1 className="text-[clamp(22px,2.6vw,30px)] m-0">{e.titre}</h1>
            <div className="flex gap-x-5 gap-y-1.5 flex-wrap text-[13.5px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={15} />
                {fmtDate(e.date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
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
            <div className="flex gap-2.5 flex-wrap mt-auto pt-2">
              <Link
                href={`/admin/evenements/${e.id}/modifier`}
                className="btn-action btn-action-sm no-underline"
              >
                <Pencil size={14} /> Modifier
              </Link>
              <Link
                href={`/membre/evenements/${e.id}`}
                className="btn-contour btn-contour-sm text-ink no-underline hover:bg-surface-2"
              >
                Page membre <ExternalLink size={13} />
              </Link>
              <DeleteEventButton eventId={e.id} titre={e.titre} />
            </div>
          </div>
        </div>
      </Card>

      {/* ==================== Chiffres ==================== */}
      <div className="grid gap-4 mb-5 sm:grid-cols-2 xl:grid-cols-4">
        <Compteur
          icone={<Users size={22} />}
          teinte="bleu"
          libelle="Inscrits"
          valeur={
            <span>
              {participants.length}
              <span className="text-[16px] text-muted"> / {e.cap}</span>
            </span>
          }
          detail={
            <Jauge valeur={participants.length} max={e.cap} teinte="vert" />
          }
        />
        <Compteur
          icone={<UserCheck size={22} />}
          teinte="vert"
          libelle="Présents"
          valeur={presents}
          detail={
            participants.length
              ? `${Math.round((presents / participants.length) * 100)} % des inscrits`
              : "Aucun inscrit"
          }
        />
        <Compteur
          icone={passe ? <UserX size={22} /> : <UserRound size={22} />}
          teinte="rouge"
          libelle={passe ? "Absents" : "À accueillir"}
          valeur={passe ? compte("absent") : compte("confirme")}
        />
        <Compteur
          icone={<Ticket size={22} />}
          teinte="vert"
          libelle="Places restantes"
          valeur={restantes}
          detail={restantes === 0 ? "Complet" : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px] items-start">
        {/* ==================== Liste d'accueil ==================== */}
        <Card className="p-0 min-w-0">
          <div className="px-6 pt-5 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-[18px] m-0">Liste d’accueil</h2>
              <p className="text-[13px] text-muted m-0 mt-1">
                Pointez les arrivées le jour J, inscrivez les arrivées directes.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <a
                href={`/admin/evenements/${e.id}/export`}
                className="btn-contour btn-contour-sm text-ink no-underline hover:bg-surface-2"
              >
                <Download size={14} /> Exporter
              </a>
              <AddAttendeeButton
                eventId={e.id}
                membres={membres.map((m) => ({
                  id: m.id,
                  nom: m.nom,
                  contact: m.nom,
                  email: "",
                }))}
              />
            </div>
          </div>

          <div className="px-6 pt-4">
            <Onglets
              actif={onglet}
              onglets={ONGLETS.map((o) => ({
                cle: o.cle,
                libelle: o.libelle,
                href: lien(o.cle),
                compte:
                  o.cle === "tous"
                    ? participants.length
                    : compte(STATUT_ONGLET[o.cle]),
              }))}
            />
            <form
              action={`/admin/evenements/${e.id}`}
              className="relative max-w-[360px] mb-4"
            >
              {onglet !== "tous" ? (
                <input type="hidden" name="onglet" value={onglet} />
              ) : null}
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
              />
              <input
                type="search"
                name="q"
                defaultValue={recherche}
                placeholder="Nom, entreprise, e-mail…"
                aria-label="Rechercher un participant"
                className="w-full rounded-[var(--radius-s)] border border-line bg-surface text-ink pl-9 pr-3 py-2.5 text-[13.5px] outline-none focus:border-accent"
              />
            </form>
          </div>

          {liste.length ? (
            <ul className="list-none m-0 p-0 border-t border-line">
              {liste.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 px-6 py-3 border-b border-line last:border-b-0 flex-wrap sm:flex-nowrap"
                >
                  <span className="min-w-0 flex-1 basis-[200px]">
                    <span className="block text-[14px] font-semibold text-ink truncate">
                      {p.nom}
                    </span>
                    <span className="block text-[12.5px] text-muted truncate">
                      {p.entreprise}
                      {p.email && p.email !== "—" ? ` · ${p.email}` : ""}
                    </span>
                  </span>
                  <Pill tone={PASTILLES[p.statut].ton}>
                    {PASTILLES[p.statut].libelle}
                  </Pill>
                  <span className="flex items-center gap-1">
                    <AttendanceButton
                      attendeeId={p.id}
                      eventId={e.id}
                      statut={p.statut}
                      onglet={onglet}
                    />
                    <RetirerParticipantButton
                      attendeeId={p.id}
                      eventId={e.id}
                      nom={p.nom}
                      onglet={onglet}
                    />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Vide icone={<Users size={26} />}>
              {recherche
                ? `Personne ne correspond à « ${recherche} ».`
                : onglet === "presents"
                  ? "Personne n’a encore été pointé présent."
                  : "Aucun participant dans cette liste."}
            </Vide>
          )}
        </Card>

        {/* ==================== Contenu publié ==================== */}
        <div className="flex flex-col gap-4">
          <Panneau titre="Programme" teinte="rouge">
            {e.programme?.length ? (
              <ol className="list-none m-0 p-0 flex flex-col gap-3">
                {e.programme.map((etape, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-[family-name:var(--font-mono)] text-[12px] font-bold text-accent-strong w-[62px] shrink-0 pt-px">
                      {etape.heure}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-semibold text-ink">
                        {etape.titre}
                      </span>
                      {etape.detail ? (
                        <span className="block text-[12.5px] text-muted">
                          {etape.detail}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="m-0 text-[13px] text-muted">
                Aucun programme publié.{" "}
                <Link
                  href={`/admin/evenements/${e.id}/modifier`}
                  className="text-accent font-semibold no-underline hover:underline"
                >
                  L’ajouter
                </Link>
              </p>
            )}
          </Panneau>

          <Panneau titre="Présentation" teinte="vert">
            <p className="m-0 text-[13.4px] text-muted leading-relaxed whitespace-pre-line line-clamp-[12]">
              <TexteLie texte={e.desc} />
            </p>
            {e.pourQui ? (
              <>
                <div className="surtitre text-faint mt-4 mb-1.5">
                  Public visé
                </div>
                <p className="m-0 text-[13.4px] text-ink leading-relaxed">
                  {e.pourQui}
                </p>
              </>
            ) : null}
          </Panneau>
        </div>
      </div>
    </>
  );
}
