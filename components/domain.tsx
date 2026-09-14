import Link from "next/link";
import type { ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  CheckCheck,
  CreditCard,
  FileText,
  ImageIcon,
  MapPin,
  MessageSquare,
  Play,
  User as UserIcon,
  Users,
} from "lucide-react";
import { Card, Pill, StatusPill } from "@/components/ui";
import { fmtDate, fmtDateShort, fmtMoney, initials, parseISO } from "@/lib/format";
import type {
  CanchamEvent,
  CanchamService,
  Member,
  NewsItem,
  NewsMedia,
  Offer,
  Produit,
  Resource,
} from "@/lib/types";

/* ==================== Visuels de remplacement ==================== */

/**
 * Faute de vrais visuels, on génère un dégradé décoratif stable à partir d'une
 * graine. Deux appels avec la même graine donnent toujours la même couleur, ce
 * qui évite le scintillement entre rendus.
 */
export function PhotoPlaceholder({
  seed,
  className = "",
  icon,
  iconSize = 20,
}: {
  seed: string;
  className?: string;
  icon?: ReactNode;
  iconSize?: number;
}) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const green = h % 2 === 0;
  const bg = green
    ? "linear-gradient(135deg, var(--accent-strong), var(--accent))"
    : "linear-gradient(135deg, var(--navy), var(--navy-2))";

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden text-white/90 shrink-0 ${className}`}
      style={{ background: bg }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.09) 0 2px, transparent 2px 20px)",
        }}
      />
      {icon ?? <ImageIcon size={iconSize} />}
    </div>
  );
}

export function LogoMark({
  member,
  size = 46,
}: {
  member: Member;
  size?: number;
}) {
  if (member.type === "physique") {
    return (
      <div style={{ width: size, height: size }} className="shrink-0">
        <PhotoPlaceholder
          seed={`rep-${member.id}`}
          className="rounded-full w-full h-full"
          icon={<UserIcon size={size * 0.4} />}
        />
      </div>
    );
  }
  return (
    <div
      className="rounded-[var(--radius-s)] bg-accent-soft text-accent-strong flex items-center justify-center font-[family-name:var(--font-display)] font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials(member.nom)}
    </div>
  );
}

/* ==================== Membres ==================== */

export function MemberCard({ member, href }: { member: Member; href: string }) {
  const swatches = ["bg-accent-soft text-accent-strong", "bg-navy-soft text-navy", "bg-surface-3 text-faint"];
  return (
    <Link href={href} className="no-underline">
      <Card className="overflow-hidden h-full flex flex-col hover:border-accent transition-colors p-0">
        <PhotoPlaceholder
          seed={member.id}
          className="h-[72px] w-full"
          icon={member.type === "physique" ? <UserIcon size={20} /> : <Building2 size={20} />}
        />
        <div className="flex gap-3 px-4 pt-4 pb-3">
          <div className="shrink-0">
            <LogoMark member={member} />
          </div>
          <div className="min-w-0">
            <h3 className="m-0 mb-0.5 text-[15px]">{member.nom}</h3>
            <div className="text-xs text-muted">{member.secteur}</div>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap px-4 pb-3">
          <Pill icon={<MapPin size={10} />}>{member.ville}</Pill>
          {member.type === "physique" ? (
            <Pill icon={<UserIcon size={10} />}>Indépendant</Pill>
          ) : null}
          <StatusPill status={member.statut} />
        </div>
        <p className="px-4 text-[12.8px] text-muted flex-1 m-0">{member.activite}</p>
        <div className="flex gap-1.5 px-4 pt-3 pb-4">
          {member.produits.map((prod: Produit, i) => (
            <div
              key={prod.label}
              className={`flex-1 aspect-square rounded-lg flex items-center justify-center text-[10px] font-semibold text-center px-1 ${swatches[i % 3]}`}
            >
              {prod.label}
            </div>
          ))}
        </div>
      </Card>
    </Link>
  );
}

/** Bloc « Besoins & intérêts » — le moteur de la mise en relation entre membres. */
export function NeedsAndInterests({ member }: { member: Member }) {
  if (!member.besoins && !member.interets) return null;
  return (
    <>
      <div className="flex items-center gap-2.5 mt-[22px] mb-3.5">
        <div className="w-[3px] self-stretch min-h-[18px] bg-accent rounded-sm" />
        <h2 className="text-[17px] font-semibold m-0">Besoins &amp; intérêts</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {member.besoins ? (
          <div>
            <div className="text-[12.3px] font-semibold text-muted mb-1.5">
              Recherche actuellement
            </div>
            <div className="text-[13.4px] text-muted leading-relaxed">
              {member.besoins}
            </div>
          </div>
        ) : null}
        {member.interets ? (
          <div>
            <div className="text-[12.3px] font-semibold text-muted mb-1.5">
              Intérêts &amp; synergies recherchées
            </div>
            <div className="text-[13.4px] text-muted leading-relaxed">
              {member.interets}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

/* ==================== Événements ==================== */

export function EventCard({
  event,
  href,
  registered = false,
  footer,
}: {
  event: CanchamEvent;
  href?: string;
  registered?: boolean;
  footer?: ReactNode;
}) {
  const d = parseISO(event.date);
  const mois = d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");

  const body = (
    <Card className="overflow-hidden h-full flex flex-col hover:border-accent transition-colors p-0">
      <div className="relative">
        <PhotoPlaceholder
          seed={event.id}
          className="h-[150px] w-full"
          icon={<CalendarDays size={28} />}
        />
        <div className="absolute top-2.5 left-2.5 bg-white rounded-[var(--radius-s)] px-2.5 py-[5px] text-center shadow-[var(--shadow)] min-w-[38px]">
          <div className="font-[family-name:var(--font-display)] font-bold text-base leading-none text-accent-strong">
            {d.getDate()}
          </div>
          <div className="text-[9px] uppercase tracking-[0.05em] font-bold text-muted">
            {mois}
          </div>
        </div>
        {registered ? (
          <div className="absolute top-2.5 right-2.5">
            <Pill tone="ok" icon={<CheckCheck size={10} />}>
              Inscrit
            </Pill>
          </div>
        ) : null}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="self-start mb-1.5">
          <Pill>{event.format}</Pill>
        </div>
        <h3 className="m-0 mb-1.5 text-[15.5px]">{event.titre}</h3>
        <EventMeta event={event} />
        <div className="flex-1" />
        {footer ? <div className="flex gap-2 mt-3 flex-wrap">{footer}</div> : null}
      </div>
    </Card>
  );

  return href ? (
    <Link href={href} className="no-underline">
      {body}
    </Link>
  ) : (
    body
  );
}

export function EventMeta({ event }: { event: CanchamEvent }) {
  return (
    <div className="text-[12.3px] text-muted flex gap-3 flex-wrap mt-1">
      <span className="inline-flex items-center gap-1">
        <MapPin size={13} /> {event.lieu}
      </span>
      <span className="inline-flex items-center gap-1">
        <Users size={13} /> {event.inscrits}/{event.cap}
      </span>
      <span className="inline-flex items-center gap-1">
        <CreditCard size={13} />{" "}
        {event.payant ? fmtMoney(event.prix) : "Gratuit"}
      </span>
    </div>
  );
}

export function EventRow({
  event,
  href,
  registered = false,
}: {
  event: CanchamEvent;
  href: string;
  registered?: boolean;
}) {
  const d = parseISO(event.date);
  const mois = d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
  return (
    <Link href={href} className="no-underline">
      <div className="flex gap-4 p-4 border border-line rounded-[var(--radius-m)] bg-surface items-center hover:border-accent transition-colors">
        <PhotoPlaceholder
          seed={event.id}
          className="w-[62px] h-[62px] rounded-[var(--radius-s)]"
          icon={<CalendarDays size={20} />}
        />
        <div className="shrink-0 w-[62px] text-center bg-accent-soft text-accent-strong rounded-[var(--radius-s)] px-1 py-2">
          <div className="font-[family-name:var(--font-display)] text-[21px] font-bold leading-none">
            {d.getDate()}
          </div>
          <div className="text-[10px] uppercase tracking-[0.06em] font-bold">{mois}</div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="m-0 mb-1 text-[15px]">
            {event.titre}{" "}
            {registered ? (
              <Pill tone="ok" icon={<CheckCheck size={10} />}>
                Inscrit
              </Pill>
            ) : null}
          </h3>
          <EventMeta event={event} />
        </div>
      </div>
    </Link>
  );
}

/* ==================== Actualités ==================== */

export function MediaBanner({ media, lg = false }: { media: NewsMedia; lg?: boolean }) {
  const bg =
    media.theme === "green"
      ? "linear-gradient(135deg, var(--accent-strong), var(--accent))"
      : "linear-gradient(135deg, var(--navy), var(--navy-2))";
  return (
    <div
      className={`relative w-full rounded-[var(--radius-m)] overflow-hidden mt-2.5 flex items-center justify-center text-white ${
        lg ? "aspect-[16/7]" : "aspect-[16/8]"
      }`}
      style={{ background: bg }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.09) 0 2px, transparent 2px 20px)",
        }}
      />
      {media.type === "video" ? (
        <>
          <div className="w-[50px] h-[50px] rounded-full bg-white/20 backdrop-blur-[2px] flex items-center justify-center">
            <Play size={lg ? 32 : 24} />
          </div>
          <span className="absolute top-2.5 left-2.5 bg-black/30 backdrop-blur-[2px] text-[10.6px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
            <Play size={10} /> Vidéo · {media.duration}
          </span>
        </>
      ) : (
        <span className="absolute top-2.5 left-2.5 bg-black/30 backdrop-blur-[2px] text-[10.6px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
          <ImageIcon size={10} /> Photo
        </span>
      )}
    </div>
  );
}

export function NewsFeedItem({ news, base }: { news: NewsItem; base: string }) {
  return (
    <article className="border border-line rounded-[var(--radius-m)] bg-surface p-4 mb-3">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-[34px] h-[34px] rounded-full bg-accent-soft text-accent-strong flex items-center justify-center font-[family-name:var(--font-display)] font-bold text-[12.5px]">
          CC
        </div>
        <div>
          <div className="font-semibold text-[13.6px]">
            CanCham Madagascar <Pill className="ml-1">{news.cat}</Pill>
          </div>
          <div className="text-[11.5px] text-faint">{fmtDate(news.date)}</div>
        </div>
      </div>
      <div className="text-[13.6px] leading-relaxed">
        <b className="block text-[14.6px] mb-1">{news.titre}</b>
        {news.extrait}
      </div>
      <MediaBanner media={news.media} />
      <div className="flex gap-4 mt-3 text-xs text-muted">
        <Link
          href={`${base}/${news.id}`}
          className="font-semibold text-accent no-underline hover:underline"
        >
          Lire l’article complet
        </Link>
        {news.commentaires.length ? (
          <span>
            {news.commentaires.length} commentaire
            {news.commentaires.length > 1 ? "s" : ""}
          </span>
        ) : null}
      </div>
    </article>
  );
}

/* ==================== Offres & services ==================== */

export function OfferCard({ offer }: { offer: Offer }) {
  return (
    <Card className="p-4 mb-2.5">
      <Pill>{offer.membre}</Pill>
      <div className="font-semibold text-[13.2px] mt-1.5 mb-1">{offer.titre}</div>
      <div className="text-[12.4px] text-muted leading-relaxed">{offer.desc}</div>
    </Card>
  );
}

export function ServiceCard({
  service,
  action,
}: {
  service: CanchamService;
  action?: ReactNode;
}) {
  const gratuit = service.type === "gratuit";
  return (
    <Card className="p-[22px] flex flex-col">
      <div
        className={`w-10 h-10 rounded-[var(--radius-s)] flex items-center justify-center mb-3 ${
          gratuit ? "bg-success-soft text-success-strong" : "bg-accent-soft text-accent-strong"
        }`}
      >
        <CreditCard size={18} />
      </div>
      <div className="font-bold text-[14.5px] mb-1.5">{service.titre}</div>
      <p className="text-[12.8px] text-muted leading-relaxed m-0 mb-3 flex-1">
        {service.desc}
      </p>
      <div>
        <Pill tone={gratuit ? "ok" : "muted"}>
          {gratuit ? "Gratuit" : fmtMoney(service.prix)}
        </Pill>
      </div>
      {action ? <div className="mt-3 flex gap-1.5">{action}</div> : null}
    </Card>
  );
}

/* ==================== Ressources ==================== */

/**
 * Carte ressource, calquée sur `EventCard` : visuel de couverture, étiquette en
 * pastille blanche au-dessus, puis catégorie, titre et métadonnées.
 */
export function ResourceCard({
  resource,
  footer,
}: {
  resource: Resource;
  footer?: ReactNode;
}) {
  const video = resource.fmt === "Vidéo";
  return (
    <Card className="overflow-hidden h-full flex flex-col p-0 hover:border-accent transition-colors">
      <div className="relative">
        <PhotoPlaceholder
          seed={resource.id}
          className="h-[150px] w-full"
          icon={video ? <Play size={28} /> : <FileText size={28} />}
        />
        <div className="absolute top-2.5 left-2.5 bg-white rounded-[var(--radius-s)] px-2.5 py-[5px] text-center shadow-[var(--shadow)] min-w-[38px]">
          <div className="font-[family-name:var(--font-display)] font-bold text-[13px] leading-none text-accent-strong">
            {resource.fmt}
          </div>
          <div className="text-[9px] uppercase tracking-[0.05em] font-bold text-muted mt-0.5">
            {resource.taille}
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex gap-1.5 flex-wrap mb-1.5">
          <Pill>{resource.cat}</Pill>
          <Pill tone={resource.type === "gratuit" ? "ok" : "muted"}>
            {resource.type === "gratuit" ? "Gratuit" : fmtMoney(resource.prix)}
          </Pill>
        </div>
        <h3 className="m-0 mb-1.5 text-[15.5px]">{resource.titre}</h3>
        <div className="text-[12.3px] text-muted flex gap-3 flex-wrap mt-1">
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={13} /> {fmtDateShort(resource.date)}
          </span>
          {resource.commentaires.length ? (
            <span className="inline-flex items-center gap-1">
              <MessageSquare size={13} /> {resource.commentaires.length} commentaire
              {resource.commentaires.length > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
        <div className="flex-1" />
        {footer ? <div className="flex gap-2 mt-3 flex-wrap">{footer}</div> : null}
      </div>
    </Card>
  );
}
