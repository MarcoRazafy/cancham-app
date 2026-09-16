"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { Bell, Menu, Search, SquareArrowOutUpRight } from "lucide-react";
import type { Notification } from "@/lib/notifications";
import { NAV_ICONS } from "@/components/nav-icons";
import { Avatar } from "@/components/ui";
import { TITLES, type NavGroup } from "@/lib/nav";
import type { Space, User } from "@/lib/types";

interface ShellProps {
  space: Space;
  user: User;
  nav: NavGroup[];
  /** Compteurs affichés à droite des entrées de menu. Clé = href. */
  badges?: Record<string, number>;
  /**
   * Hrefs verrouillés parce que l'adhésion n'est pas effective. Ils restent
   * visibles mais inertes — le membre doit voir ce qu'il débloquera.
   */
  lockedHrefs?: string[];
  /** Calculées côté serveur à partir de l'état réel de la base. */
  notifications?: Notification[];
  children: ReactNode;
}

export function Shell({
  space,
  user,
  nav,
  badges = {},
  lockedHrefs = [],
  notifications = [],
  children,
}: ShellProps) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  const [crumb, title] = TITLES[pathname] ?? [
    space === "admin" ? "Back-office" : "Espace membre",
    "",
  ];

  return (
    <div className="flex min-h-screen">
      {navOpen ? (
        <button
          aria-label="Fermer le menu"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 bg-black/40 z-35 md:hidden"
        />
      ) : null}

      <aside
        className={`w-[var(--sidebar-w)] shrink-0 bg-navy text-[#dce6de] flex flex-col fixed inset-y-0 left-0 z-40 transition-transform duration-200 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="px-5 pt-[22px] pb-4 border-b border-white/10">
          <div className="font-[family-name:var(--font-display)] font-semibold text-[22px] text-white tracking-[0.2px]">
            Can<span className="text-accent">Cham</span> Connect
          </div>
          <div className="mt-0.5 text-[10.5px] tracking-[0.14em] uppercase text-[#8fa396]">
            Chambre Canada – Madagascar
          </div>
        </div>

        <SpaceSwitcher current={space} />

        <nav className="flex-1 overflow-y-auto px-3 pt-3.5 pb-3">
          {nav.map((group) => (
            <div key={group.label}>
              <div className="text-[10.5px] uppercase tracking-[0.12em] text-[#6f8477] mx-2.5 mt-4 mb-1.5 font-semibold">
                {group.label}
              </div>
              {group.items.map((item) => {
                const Icon = NAV_ICONS[item.icon] ?? NAV_ICONS.home;
                const LockIcon = NAV_ICONS.lock;
                const active =
                  pathname === item.href ||
                  (item.href !== `/${space}` &&
                    pathname.startsWith(`${item.href}/`));
                const locked = lockedHrefs.includes(item.href);
                const badge = badges[item.href];

                if (locked) {
                  return (
                    <span
                      key={item.href}
                      title="Accès disponible après validation de votre adhésion"
                      className="flex items-center gap-2.5 px-2.5 py-[9px] rounded-[var(--radius-s)] text-[13.6px] font-medium opacity-40 cursor-not-allowed"
                    >
                      <LockIcon size={17} className="shrink-0" />
                      <span>{item.label}</span>
                    </span>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setNavOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-[9px] rounded-[var(--radius-s)] text-[13.6px] font-medium no-underline ${
                      active
                        ? "bg-accent text-white"
                        : "text-[#c7d4c9] hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    <Icon size={17} className="shrink-0 opacity-85" />
                    <span>{item.label}</span>
                    {badge ? (
                      <span
                        className={`ml-auto text-[10.5px] font-bold px-[7px] py-px rounded-full text-white ${
                          active ? "bg-white/30" : "bg-white/15"
                        }`}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="px-4 pt-3 pb-[18px] border-t border-white/10 flex items-center gap-2.5">
          <Avatar
            src={user.photo}
            alt={user.nom}
            initials={user.initiales}
            className={
              space === "admin"
                ? "bg-linear-150 from-[#4a6580] to-[#2c4258] text-white"
                : "bg-accent-soft text-accent-strong"
            }
          />
          <div className="min-w-0">
            <div className="text-[12.8px] font-semibold text-white truncate">
              {user.nom}
            </div>
            <div className="text-[11px] text-[#8fa396] truncate">
              {user.fonction}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col md:ml-[var(--sidebar-w)]">
        <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur-md border-b border-line flex items-center gap-3.5 px-4 md:px-7 py-3.5">
          <button
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Ouvrir le menu"
            className="md:hidden border border-line bg-surface rounded-[var(--radius-s)] p-[7px] cursor-pointer"
          >
            <Menu size={18} />
          </button>
          <div>
            <div className="text-xs text-faint">{crumb}</div>
            <div className="font-[family-name:var(--font-display)] font-semibold text-[19px]">
              {title}
            </div>
          </div>
          <div className="flex-1" />
          {/* useSearchParams exige une frontière Suspense, sans quoi toutes
              les pages du Shell basculent hors du rendu statique. */}
          <Suspense fallback={<div className="w-[150px] h-[33px]" />}>
            <SearchBox space={space} />
          </Suspense>
          <NotificationsMenu space={space} notifications={notifications} />
        </header>

        <main className="px-4 md:px-7 pt-6 pb-16 max-w-[1180px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Recherche transversale.
 *
 * Un simple formulaire GET : la requête part dans l'URL, la page de résultats
 * la lit côté serveur. Fonctionne sans JavaScript, et le résultat est
 * partageable par lien.
 */
function SearchBox({ space }: { space: Space }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const surPageRecherche = pathname === `/${space}/recherche`;

  return (
    <form action={`/${space}/recherche`} className="flex items-center">
      <div className="relative">
        <Search
          size={15}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
        />
        <input
          type="search"
          name="q"
          defaultValue={surPageRecherche ? (params.get("q") ?? "") : ""}
          placeholder="Rechercher…"
          aria-label="Rechercher"
          className="w-[150px] focus:w-[230px] transition-[width] border border-line bg-surface text-ink rounded-[var(--radius-s)] pl-8 pr-2.5 py-[7px] text-[13px]"
        />
      </div>
    </form>
  );
}

const TONS: Record<Notification["ton"], string> = {
  info: "bg-navy",
  warn: "bg-warn",
  bad: "bg-bad",
};

/**
 * Menu des notifications.
 *
 * Construit sur `<details>` : l'ouverture, la fermeture et le clavier sont
 * gérés par le navigateur, sans état React ni gestionnaire de clic extérieur.
 */
function NotificationsMenu({
  space,
  notifications,
}: {
  space: Space;
  notifications: Notification[];
}) {
  const urgentes = notifications.filter((n) => n.ton !== "info").length;

  return (
    <details className="relative group">
      <summary
        aria-label={`Notifications (${notifications.length})`}
        className="list-none border border-line bg-surface w-9 h-9 rounded-[var(--radius-s)] flex items-center justify-center cursor-pointer text-muted hover:text-ink hover:border-faint [&::-webkit-details-marker]:hidden"
      >
        <Bell size={16} />
        {notifications.length ? (
          <span
            className={`absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full border-[1.5px] border-surface ${
              urgentes ? "bg-bad" : "bg-navy"
            }`}
          />
        ) : null}
      </summary>

      <div className="absolute right-0 top-11 z-50 w-[320px] max-w-[calc(100vw-32px)] bg-surface border border-line rounded-[var(--radius-m)] shadow-[var(--shadow)] overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-line text-[11px] uppercase tracking-[0.08em] text-faint font-semibold">
          Notifications
        </div>

        {notifications.length ? (
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.map((n, i) => (
              <Link
                key={n.id}
                href={n.href}
                className={`flex gap-2.5 px-3.5 py-3 no-underline hover:bg-surface-2 ${
                  i < notifications.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <span
                  className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${TONS[n.ton]}`}
                />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-ink">
                    {n.titre}
                  </span>
                  <span className="block text-[11.5px] text-faint">
                    {n.temps}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-3.5 py-6 text-center text-[13px] text-muted">
            Rien de nouveau.
          </div>
        )}

        <Link
          href={space === "admin" ? "/admin" : "/membre"}
          className="block px-3.5 py-2.5 border-t border-line text-[12.4px] font-semibold text-accent no-underline hover:bg-surface-2"
        >
          Voir le tableau de bord
        </Link>
      </div>
    </details>
  );
}

/**
 * Bascule entre les trois espaces.
 *
 * Tant qu'il n'y a pas d'authentification, c'est ce sélecteur — et l'URL — qui
 * déterminent qui l'on est. Il devra disparaître le jour où l'on branche une
 * vraie session.
 */
function SpaceSwitcher({ current }: { current: Space }) {
  const spaces: { key: Space; href: string; label: string }[] = [
    { key: "public", href: "/public", label: "Public" },
    { key: "membre", href: "/membre", label: "Membre" },
    { key: "admin", href: "/admin", label: "Admin" },
  ];
  return (
    <div className="mx-4 mt-3.5 mb-1">
      <div className="flex gap-0.5 p-[3px] rounded-full bg-white/[0.06] border border-white/10">
        {spaces.map((s) => (
          <Link
            key={s.key}
            href={s.href}
            className={`flex-1 text-center text-xs font-semibold px-2 py-[7px] rounded-full no-underline ${
              s.key === current
                ? s.key === "admin"
                  ? "bg-white text-navy"
                  : "bg-accent text-white"
                : "text-[#9fb2a5] hover:text-white"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-[#6f8477]">
        <SquareArrowOutUpRight size={11} />
        Sans authentification — l’espace suit l’URL
      </div>
    </div>
  );
}
