import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  Briefcase,
  Building2,
  CalendarDays,
  CheckCheck,
  CreditCard,
  FileText,
  ImageIcon,
  MapPin,
  MessageSquare,
  Play,
  Tag,
  User as UserIcon,
  Users,
} from "lucide-react";
import { Card, Pill, StatusPill } from "@/components/ui";
import { Reactions } from "@/components/forms/Reactions";
import { TexteLie } from "@/components/TexteLie";
import { filetDe } from "@/lib/filets";
import { initialesDe } from "@/lib/avatars";
import {
  fmtDate,
  fmtDateShort,
  fmtMoney,
  initials,
  parseISO,
} from "@/lib/format";
import type {
  CanchamEvent,
  CanchamService,
  Contact,
  Member,
  NewsItem,
  NewsMedia,
  Offer,
  Produit,
  Resource,
  Space,
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

/**
 * Vignette ronde : la photo si elle existe, les initiales sinon.
 *
 * Une seule implémentation pour l'annuaire, la messagerie et la barre du haut,
 * de sorte que le repli soit identique partout le jour où une URL casse — et
 * qu'il n'y ait qu'un endroit à toucher quand la chambre versera ses propres
 * portraits.
 */
export function AvatarRond({
  src,
  alt,
  initiales,
  taille,
  className = "",
  style,
  ajuste = "couverture",
}: {
  src?: string | null;
  alt: string;
  initiales: string;
  taille: number;
  /** Habillage du repli en initiales : fond, texte, bordure. */
  className?: string;
  style?: CSSProperties;
  /**
   * `couverture` remplit le rond en rognant — c'est ce qu'il faut d'un
   * portrait ou d'une photo. `contenu` inscrit l'image entière dans le rond :
   * un logo a ses propres marges, les rogner le mutile.
   */
  ajuste?: "couverture" | "contenu";
}) {
  if (src) {
    const contenu = ajuste === "contenu";
    return (
      <span
        className={`rounded-full overflow-hidden shrink-0 block ${
          contenu ? "bg-white border border-line p-1.5" : "bg-line"
        }`}
        style={{ width: taille, height: taille }}
      >
        <Image
          src={src}
          alt={alt}
          width={taille}
          height={taille}
          sizes={`${taille}px`}
          className={`w-full h-full ${contenu ? "object-contain" : "object-cover"}`}
        />
      </span>
    );
  }

  return (
    <span
      className={`rounded-full flex items-center justify-center font-bold shrink-0 ${className}`}
      style={{
        ...style,
        width: taille,
        height: taille,
        fontSize: taille * 0.36,
      }}
    >
      {initiales}
    </span>
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
    if (member.photo) {
      return (
        <AvatarRond
          src={member.photo}
          alt={member.nom}
          initiales=""
          taille={size}
        />
      );
    }
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
  // Le logo passe avant tout : c'est l'identité officielle de l'organisation.
  // Le cadre s'allonge au lieu de le comprimer : presque tous les logos sont
  // horizontaux, et dans un carré ils se réduisent à une bande illisible.
  if (member.logo) {
    return (
      <div
        className="rounded-[var(--radius-s)] bg-white border border-line flex items-center justify-center shrink-0 px-2 py-1.5"
        style={{ width: size * 1.75, height: size }}
      >
        <Image
          src={member.logo}
          alt={member.nom}
          width={Math.round(size * 1.75)}
          height={size}
          sizes={`${Math.round(size * 1.75)}px`}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // À défaut, le visuel d'activité. Le monogramme ne sert que de dernier repli.
  if (member.photo) {
    return (
      <div
        className="rounded-[var(--radius-s)] overflow-hidden bg-surface-2 border border-line shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src={member.photo}
          alt={member.nom}
          width={size}
          height={size}
          sizes={`${size}px`}
          className="w-full h-full object-cover"
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

/**
 * Visuel réel s'il existe, dégradé décoratif sinon.
 *
 * Toutes les vignettes de l'application passent par ici : le jour où la chambre
 * fournit ses propres photos, il n'y a qu'un champ à renseigner en base.
 */
export function Visuel({
  src,
  alt,
  seed,
  className = "",
  icon,
  iconSize = 20,
  sizes = "400px",
}: {
  src?: string | null;
  alt: string;
  seed: string;
  className?: string;
  icon?: ReactNode;
  iconSize?: number;
  sizes?: string;
}) {
  if (!src) {
    return (
      <PhotoPlaceholder
        seed={seed}
        className={className}
        icon={icon}
        iconSize={iconSize}
      />
    );
  }
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
    </div>
  );
}

/* ==================== Membres ==================== */

/**
 * Secteur d'activité, en étiquette. En simple ligne grise sous le nom, on ne
 * le reconnaissait pas pour ce qu'il est : c'est pourtant le premier filtre
 * de l'annuaire.
 */
export function PuceSecteur({
  secteur,
  grand = false,
}: {
  secteur: string;
  grand?: boolean;
}) {
  return (
    <span
      title="Secteur d’activité"
      className={`inline-flex items-center gap-1.5 max-w-full font-semibold rounded-full bg-navy-soft text-navy ${
        grand ? "text-[12.5px] px-3 py-1" : "text-[11.3px] px-2.5 py-[3px]"
      }`}
    >
      <Briefcase size={grand ? 13 : 11} className="shrink-0" />
      <span className="truncate">{secteur}</span>
    </span>
  );
}

export function MemberCard({ member, href }: { member: Member; href: string }) {
  // Trois fonds sobres : le bleu marine sur bleu marine du jeu précédent
  // rendait le libellé illisible sur fond sombre.
  const swatches = [
    "bg-surface-2 text-muted",
    "bg-surface-3 text-muted",
    "bg-accent-soft text-accent-strong",
  ];
  // Le carré n'a de sens que pour montrer une photo de produit. Sans photo,
  // il laissait un grand vide autour d'un libellé de deux mots.
  const avecPhotos = member.produits.some((p) => p.photos.length > 0);
  return (
    <Link href={href} className="no-underline">
      <Card
        className={`carte-filet filet-bas ${filetDe(member.id)} h-full flex flex-col transition-shadow hover:shadow-[0_12px_28px_-20px_rgba(15,29,44,0.45)] p-0`}
      >
        <Visuel
          src={member.cover}
          alt=""
          seed={member.id}
          className="h-[104px] w-full"
          sizes="(max-width: 768px) 100vw, 380px"
          icon={
            member.type === "physique" ? (
              <UserIcon size={20} />
            ) : (
              <Building2 size={20} />
            )
          }
        />
        <div className="flex gap-3 px-4 pt-4 pb-3">
          <div className="shrink-0">
            <LogoMark member={member} />
          </div>
          <div className="min-w-0">
            <h3 className="m-0 mb-1.5 text-[15px]">{member.nom}</h3>
            <PuceSecteur secteur={member.secteur} />
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap px-4 pb-3">
          <Pill icon={<MapPin size={10} />}>{member.ville}</Pill>
          {member.type === "physique" ? (
            <Pill icon={<UserIcon size={10} />}>Indépendant</Pill>
          ) : null}
          <StatusPill status={member.statut} />
        </div>
        <p className="px-4 text-[12.8px] text-muted flex-1 m-0">
          {/* La carte entière est un lien : pas de `<a>` dans le `<a>`. */}
          <TexteLie texte={member.activite} dansUnLien />
        </p>
        <div
          className={`px-4 pt-3 pb-4 ${
            avecPhotos ? "flex gap-1.5" : "flex gap-1.5 flex-wrap"
          }`}
        >
          {member.produits.map((prod: Produit, i) => (
            <div
              key={prod.label}
              className={
                avecPhotos
                  ? `flex-1 aspect-square rounded-lg overflow-hidden flex items-center justify-center text-[10px] font-semibold text-center px-1 ${swatches[i % 3]}`
                  : `rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${swatches[i % 3]}`
              }
            >
              {prod.photos[0] ? (
                <Image
                  src={prod.photos[0]}
                  alt={prod.label}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              ) : (
                prod.label
              )}
            </div>
          ))}
        </div>
      </Card>
    </Link>
  );
}

/**
 * Bloc « Besoins & intérêts » — le moteur de la mise en relation entre membres.
 *
 * Besoins et intérêts se lisent en une seule liste à tirets, sous « Recherche
 * actuellement » : deux colonnes de prose disaient deux fois la même chose, là
 * où un lecteur cherche d'un coup d'œil s'il peut répondre. Chaque ligne saisie
 * devient un tiret ; un tiret tapé en tête de ligne est retiré, pour ne pas
 * s'afficher en double.
 */
export function NeedsAndInterests({ member }: { member: Member }) {
  const lignes = [member.besoins, member.interets]
    .flatMap((texte) => (texte ?? "").split("\n"))
    .map((ligne) => ligne.replace(/^\s*[-–—•*]\s*/, "").trim())
    .filter(Boolean);
  if (!lignes.length) return null;

  return (
    <>
      <div className="flex items-center gap-2.5 mt-[22px] mb-3.5">
        <div className="w-[3px] self-stretch min-h-[18px] bg-accent rounded-sm" />
        <h2 className="text-[17px] font-semibold m-0">
          Besoins &amp; intérêts
        </h2>
      </div>
      <div className="text-[12.3px] font-semibold text-muted mb-2">
        Recherche actuellement
      </div>
      <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
        {lignes.map((ligne, i) => (
          <li
            key={i}
            className="flex gap-2.5 text-[13.4px] text-muted leading-relaxed"
          >
            <span aria-hidden className="text-accent font-bold shrink-0">
              –
            </span>
            <span className="min-w-0">
              <TexteLie texte={ligne} />
            </span>
          </li>
        ))}
      </ul>
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
  const mois = d
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "");

  const body = (
    <Card
      className={`carte-filet filet-bas ${href ? "" : "filet-fixe"} ${filetDe(event.id)} h-full flex flex-col transition-shadow hover:shadow-[0_12px_28px_-20px_rgba(15,29,44,0.45)] p-0`}
    >
      <div className="relative">
        <Visuel
          src={event.photo}
          alt=""
          seed={event.id}
          className="h-[150px] w-full"
          sizes="(max-width: 768px) 100vw, 420px"
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
        {footer ? (
          <div className="flex gap-2 mt-3 flex-wrap">{footer}</div>
        ) : null}
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
  const mois = d
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "");
  return (
    <Link href={href} className="no-underline">
      <div className="flex gap-4 p-4 border border-line rounded-[var(--radius-m)] bg-surface items-center hover:border-accent transition-colors">
        <Visuel
          src={event.photo}
          alt=""
          seed={event.id}
          className="w-[62px] h-[62px] rounded-[var(--radius-s)] shrink-0"
          sizes="62px"
          icon={<CalendarDays size={20} />}
        />
        <div className="shrink-0 w-[62px] text-center bg-accent-soft text-accent-strong rounded-[var(--radius-s)] px-1 py-2">
          <div className="font-[family-name:var(--font-display)] text-[21px] font-bold leading-none">
            {d.getDate()}
          </div>
          <div className="text-[10px] uppercase tracking-[0.06em] font-bold">
            {mois}
          </div>
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

export function MediaBanner({
  media,
  lg = false,
}: {
  media: NewsMedia;
  lg?: boolean;
}) {
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

/**
 * Photos d'une publication dans le fil : une seule en pleine largeur, deux
 * côte à côte, trois en une grande et deux petites, quatre et plus en
 * damier — la dernière case annonce combien il en reste. Chaque case mène à
 * l'article, où la galerie complète se parcourt.
 */
export function MosaiquePhotos({
  images,
  alt,
  href,
}: {
  images: string[];
  alt: string;
  href: string;
}) {
  const visibles = images.slice(0, 4);
  const reste = images.length - visibles.length;
  const disposition =
    visibles.length === 1
      ? "grid-cols-1"
      : visibles.length === 3
        ? "grid-cols-2 grid-rows-2"
        : "grid-cols-2";

  return (
    <div
      className={`grid gap-1.5 mt-2.5 rounded-[var(--radius-m)] overflow-hidden ${disposition} ${
        visibles.length === 1 ? "aspect-[16/8]" : "aspect-[16/10]"
      }`}
    >
      {visibles.map((src, i) => (
        <Link
          key={src + i}
          href={href}
          aria-label={
            i === 0 ? `Lire : ${alt}` : `Photo ${i + 1} sur ${images.length}`
          }
          className={`relative block overflow-hidden group bg-surface-2 ${
            visibles.length === 3 && i === 0 ? "row-span-2" : ""
          }`}
        >
          <Image
            src={src}
            alt={i === 0 ? alt : ""}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {reste > 0 && i === visibles.length - 1 ? (
            <span className="absolute inset-0 bg-[#0f1d2c]/55 text-white flex items-center justify-center text-[22px] font-bold">
              +{reste}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

export function NewsFeedItem({
  news,
  base,
  space,
  actions,
}: {
  news: NewsItem;
  base: string;
  space: Space;
  /** Commandes de l'équipe, posées à côté du lien vers l'article. */
  actions?: ReactNode;
}) {
  return (
    <article className="border border-line rounded-[var(--radius-m)] bg-surface p-4 mb-3">
      <div className="flex items-center gap-2.5 mb-2.5">
        {/*
          Le sigle est large (1888 × 1159) : en `contain` et sans marge, il
          occupe toute la largeur du rond et reste lisible jusqu'au mot
          « CanCham ». Un `cover` lui couperait la feuille d'érable.
        */}
        <div className="w-11 h-11 rounded-full bg-white border border-line flex items-center justify-center shrink-0 overflow-hidden">
          <Image
            src="/marque/sigle.png"
            alt="CanCham Madagascar"
            width={44}
            height={44}
            sizes="44px"
            className="w-full h-full object-contain"
          />
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
        <TexteLie texte={news.extrait} />
      </div>
      {news.images.length ? (
        <MosaiquePhotos
          images={news.images}
          alt={news.titre}
          href={`${base}/${news.id}`}
        />
      ) : (
        <MediaBanner media={news.media} />
      )}
      <div className="flex items-center justify-between gap-3 flex-wrap mt-3 pt-3 border-t border-line">
        <Reactions
          newsId={news.id}
          space={space}
          jaimes={news.jaimes}
          jaimeParMoi={news.jaimeParMoi}
          commentaires={news.commentaires.length}
          lienCommentaires={`${base}/${news.id}#commentaires`}
        />
        <div className="flex items-center gap-3">
          <Link
            href={`${base}/${news.id}`}
            className="text-[12.8px] font-semibold text-accent no-underline hover:underline"
          >
            Lire l’article complet
          </Link>
          {actions ? <div className="flex gap-1.5">{actions}</div> : null}
        </div>
      </div>
    </article>
  );
}

/* ==================== Offres & services ==================== */

export function OfferCard({ offer, href }: { offer: Offer; href?: string }) {
  const corps = (
    <Card
      className={`carte-filet filet-bas filet-degrade ${
        href ? "" : "filet-fixe"
      } p-0 h-full flex flex-col overflow-hidden transition-shadow hover:shadow-[0_12px_28px_-20px_rgba(15,29,44,0.45)]`}
    >
      <div className="overflow-hidden">
        <Visuel
          src={offer.cover}
          alt={offer.titre}
          seed={offer.id}
          className="h-[88px] w-full transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 100vw, 240px"
          iconSize={18}
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <Pill className="self-start">{offer.membre}</Pill>
        <div className="font-semibold text-[13.2px] mt-2 mb-1">
          {offer.titre}
        </div>
        <div className="text-[12.4px] text-muted leading-relaxed">
          <TexteLie texte={offer.desc} dansUnLien={Boolean(href)} />
        </div>
      </div>
    </Card>
  );

  // Sans destination — l'entreprise n'a pas de fiche consultable ici — la carte
  // reste un bloc inerte plutôt qu'un lien qui ne mènerait nulle part.
  if (!href) return corps;

  return (
    <Link href={href} className="no-underline block h-full group">
      {corps}
    </Link>
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
    <Card
      className={`tuile-hote carte-filet filet-fixe ${gratuit ? "filet-vert" : "filet-rouge"} p-[22px] flex flex-col`}
    >
      {/*
        Vert pour ce qui est inclus dans l'adhésion, rouge pour ce qui est
        facturé. L'icône dit la même chose que la couleur : une étiquette pour
        ce qui est offert, une carte bancaire pour ce qui se règle. Les deux
        types portaient jusqu'ici la même carte bancaire, ce qui laissait la
        couleur seule distinguer un service inclus d'un service payant.
      */}
      <div
        className={`tuile tuile-sm mb-4 ${gratuit ? "tuile-verte" : "tuile-rouge"}`}
      >
        {gratuit ? <Tag size={24} /> : <CreditCard size={24} />}
      </div>
      <div className="font-bold text-[14.5px] mb-1.5">{service.titre}</div>
      <p className="text-[12.8px] text-muted leading-relaxed m-0 mb-3 flex-1">
        <TexteLie texte={service.desc} />
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
    <Card
      className={`carte-filet filet-fixe filet-bas ${
        resource.type === "gratuit" ? "filet-vert" : "filet-rouge"
      } h-full flex flex-col p-0 transition-shadow hover:shadow-[0_12px_28px_-20px_rgba(15,29,44,0.45)]`}
    >
      <div className="relative">
        <Visuel
          src={resource.cover}
          alt=""
          seed={resource.id}
          className="h-[150px] w-full"
          sizes="(max-width: 768px) 100vw, 400px"
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
              <MessageSquare size={13} /> {resource.commentaires.length}{" "}
              commentaire
              {resource.commentaires.length > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
        <div className="flex-1" />
        {footer ? (
          <div className="flex gap-2 mt-3 flex-wrap">{footer}</div>
        ) : null}
      </div>
    </Card>
  );
}

/* ==================== Contacts ==================== */

/**
 * Les personnes à joindre chez un membre.
 *
 * Partagée par « Mon entreprise », la fiche d'annuaire et le back-office. Les
 * deux dernières la lisent sans rien pouvoir changer : on ne gère pas les
 * contacts d'une autre entreprise. Les commandes arrivent donc de l'appelant
 * plutôt que d'être câblées ici, ce qui garde ce fichier libre de tout client.
 */
export function ListeContacts({
  contacts,
  titre = "Contacts",
  intro,
  action,
  actionContact,
}: {
  contacts: Contact[];
  titre?: string;
  intro?: string;
  /** Commande d'en-tête, par exemple « Ajouter un contact ». */
  action?: ReactNode;
  /** Commande par ligne, par exemple le retrait. */
  actionContact?: (contact: Contact) => ReactNode;
}) {
  if (!contacts.length) return null;

  return (
    <>
      <div className="flex items-center gap-2.5 mt-[22px] mb-1 flex-wrap">
        <div className="w-[3px] self-stretch min-h-[18px] bg-accent rounded-sm" />
        <h2 className="text-[17px] font-semibold m-0">{titre}</h2>
        {action ? (
          <>
            <span className="flex-1" />
            {action}
          </>
        ) : null}
      </div>
      {intro ? (
        <p className="text-[12.8px] text-muted mt-0 mb-3.5">{intro}</p>
      ) : (
        <div className="mb-3.5" />
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {contacts.map((c) => (
          <div
            key={c.id}
            className="carte-filet filet-fixe filet-bleu border border-line rounded-[var(--radius-m)] p-4 flex gap-3 items-start"
          >
            <AvatarRond
              src={c.photo}
              alt={c.nom}
              initiales={initialesDe(c.nom)}
              taille={42}
              className="bg-accent-soft text-accent-strong"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13.8px] font-semibold text-ink">
                  {c.nom}
                </span>
                {c.principal ? <Pill>Contact principal</Pill> : null}
              </div>
              <div className="text-[12.5px] text-muted">{c.fonction}</div>
              <a
                href={`mailto:${c.email}`}
                className="block text-[12.8px] text-accent no-underline hover:underline mt-1.5 truncate"
              >
                {c.email}
              </a>
              {c.tel ? (
                <a
                  href={`tel:${c.tel.replace(/\s/g, "")}`}
                  className="block text-[12.8px] text-ink no-underline hover:underline font-[family-name:var(--font-mono)]"
                >
                  {c.tel}
                </a>
              ) : null}
            </div>
            {actionContact?.(c)}
          </div>
        ))}
      </div>
    </>
  );
}
