"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { NAV_ICONS } from "@/components/nav-icons";
import { titrePour, type NavGroup } from "@/lib/nav";
import type { Notification } from "@/lib/notifications";
import type { Space, User } from "@/lib/types";

/**
 * Coquille du back-office.
 *
 * Même charte que l'espace membre — polices, rouge et vert de la chambre,
 * barre supérieure bleue — pour que l'équipe travaille dans l'outil que voient
 * les membres. La barre latérale passe au bleu nuit : on sait, sans lire, que
 * l'on administre.
 */
export function CoquilleAdmin({
  user,
  nav,
  badges = {},
  notifications = [],
  children,
}: {
  user: User;
  nav: NavGroup[];
  /** Compteurs affichés à droite des entrées de menu. Clé = href. */
  badges?: Record<string, number>;
  notifications?: Notification[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [fil, titre] = titrePour(pathname, ["Back-office", ""]);

  return (
    <div className="espace-admin flex min-h-screen">
      {menuOuvert ? (
        <button
          aria-label="Fermer le menu"
          onClick={() => setMenuOuvert(false)}
          className="fixed inset-0 bg-black/55 z-35 lg:hidden"
        />
      ) : null}

      {/* ==================== Barre latérale ==================== */}
      <aside
        className={`w-[274px] shrink-0 flex flex-col fixed inset-y-0 left-0 z-40 text-white transition-transform duration-200 ${
          menuOuvert ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        style={{ background: "var(--laterale)" }}
      >
        <div className="px-5 pt-7 pb-5">
          <Link
            href="/admin"
            className="no-underline block"
            aria-label="Tableau de bord"
          >
            <Image
              src="/marque/logo-blanc.png"
              alt="CanCham — Chambre de Commerce et de Coopération Canada-Madagascar"
              width={2383}
              height={711}
              priority
              sizes="230px"
              className="w-full h-auto"
            />
          </Link>
          {/* Le filet de la charte, du rouge au vert, sous la mention de l'espace. */}
          <div className="mt-5 flex items-center gap-2.5">
            <span className="surtitre text-white/55">Back-office</span>
            <span
              className="h-[2px] flex-1 rounded-full"
              style={{ background: "var(--marque-degrade)" }}
            />
          </div>
        </div>

        <nav className="defilement-sombre flex-1 overflow-y-auto px-3.5 pb-4">
          {nav.map((groupe, i) => (
            <div
              key={groupe.label || `groupe-${i}`}
              className={i > 0 ? "mt-4 pt-4 border-t border-white/[0.08]" : ""}
            >
              {groupe.label ? (
                <div className="surtitre text-white/35 mx-3 mb-2">
                  {groupe.label}
                </div>
              ) : null}

              {groupe.items.map((item) => {
                const Icone = NAV_ICONS[item.icon] ?? NAV_ICONS.home;
                const actif =
                  pathname === item.href ||
                  (item.href !== "/admin" &&
                    pathname.startsWith(`${item.href}/`));
                const badge = badges[item.href];

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOuvert(false)}
                    className={`entree-menu flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-lg text-[14px] no-underline transition-colors ${
                      actif
                        ? "entree-menu-actif bg-accent text-white font-semibold shadow-[0_2px_10px_-2px_rgba(173,7,7,0.6)]"
                        : "text-white/70 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    <Icone size={18} className="shrink-0 opacity-90" />
                    <span className="flex-1">{item.label}</span>
                    {badge ? (
                      <span
                        className={`pastille text-[11px] font-bold min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center ${
                          actif
                            ? "bg-white/25 text-white"
                            : "bg-accent text-white"
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

        <ChoixEspace />

        <div className="mx-3.5 mb-5 mt-2 px-3 pt-4 pb-1 flex items-center gap-3 border-t-2 border-accent">
          <Portrait user={user} taille={40} />
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-semibold text-white truncate">
              {user.nom}
            </span>
            <span className="block text-[11.5px] text-white/50 truncate">
              {user.fonction} · Équipe CanCham
            </span>
          </span>
        </div>
      </aside>

      {/* ==================== Contenu ==================== */}
      <div className="flex-1 min-w-0 flex flex-col lg:ml-[274px]">
        <header
          className="sticky top-0 z-30 border-b border-white/10 flex items-center gap-4 px-4 md:px-7 py-3 text-white"
          style={{ background: "var(--superieure)" }}
        >
          <button
            onClick={() => setMenuOuvert((v) => !v)}
            aria-label="Ouvrir le menu"
            className="lg:hidden border border-white/20 bg-white/10 text-white rounded-lg p-2 cursor-pointer"
          >
            <Menu size={18} />
          </button>

          <div className="text-[13px] text-white/60 whitespace-nowrap hidden sm:block">
            {fil} <span className="mx-1.5 opacity-50">/</span>
            <span className="text-white font-semibold">{titre}</span>
          </div>

          <Suspense fallback={<div className="flex-1" />}>
            <Recherche />
          </Suspense>

          <div className="flex items-center gap-2 shrink-0">
            <Notifications notifications={notifications} />
            <Portrait user={user} taille={36} />
          </div>
        </header>

        <main className="px-4 md:px-7 pt-7 pb-16 max-w-[1240px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function Portrait({ user, taille }: { user: User; taille: number }) {
  if (user.photo) {
    return (
      <span
        className="rounded-full overflow-hidden shrink-0 block border border-white/25"
        style={{ width: taille, height: taille }}
      >
        <Image
          src={user.photo}
          alt={user.nom}
          width={taille}
          height={taille}
          sizes={`${taille}px`}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }
  return (
    <span
      className="rounded-full flex items-center justify-center font-bold shrink-0 bg-white/15 text-white border border-white/25"
      style={{ width: taille, height: taille, fontSize: taille * 0.36 }}
    >
      {user.initiales}
    </span>
  );
}

/** Recherche transversale, en formulaire GET : partageable et sans JavaScript. */
function Recherche() {
  const pathname = usePathname();
  const params = useSearchParams();
  const surRecherche = pathname === "/admin/recherche";

  return (
    <form action="/admin/recherche" className="flex-1 flex justify-center px-2">
      <div className="relative w-full max-w-[420px]">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45 pointer-events-none"
        />
        <input
          type="search"
          name="q"
          defaultValue={surRecherche ? (params.get("q") ?? "") : ""}
          placeholder="Rechercher un membre, un événement…"
          aria-label="Rechercher dans le back-office"
          className="w-full border border-white/20 bg-white/10 text-white placeholder:text-white/45 rounded-lg pl-10 pr-3 py-2.5 text-[13.5px] outline-none focus:border-white/45 focus:bg-white/15"
        />
      </div>
    </form>
  );
}

const TONS: Record<Notification["ton"], string> = {
  info: "bg-navy",
  warn: "bg-warn",
  bad: "bg-accent",
};

/**
 * Notifications, calculées côté serveur à partir de l'état de la base.
 *
 * Sur `<details>` : ouverture, fermeture et clavier sont gérés par le
 * navigateur. On le referme seulement au clic extérieur et au changement de
 * page, ce que `<details>` ne fait pas seul.
 */
function Notifications({ notifications }: { notifications: Notification[] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const urgentes = notifications.filter((n) => n.ton !== "info").length;

  useEffect(() => {
    ref.current?.removeAttribute("open");
  }, [pathname]);

  useEffect(() => {
    const fermer = (e: PointerEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node))
        ref.current.removeAttribute("open");
    };
    document.addEventListener("pointerdown", fermer);
    return () => document.removeEventListener("pointerdown", fermer);
  }, []);

  return (
    <details ref={ref} className="relative">
      <summary
        aria-label={`Notifications (${notifications.length})`}
        className="list-none relative w-9 h-9 rounded-lg flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 cursor-pointer [&::-webkit-details-marker]:hidden"
      >
        <Bell size={17} />
        {notifications.length ? (
          <span
            className={`pastille absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-[#0f1d2c] ${
              urgentes ? "bg-accent" : "bg-white/70"
            }`}
          />
        ) : null}
      </summary>

      <div className="absolute right-0 top-11 z-50 w-[340px] max-w-[calc(100vw-32px)] bg-surface text-ink border border-line rounded-[var(--radius-m)] shadow-[var(--shadow)] overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          <span className="surtitre text-faint">À suivre</span>
          <span className="text-[11.5px] text-faint">
            {notifications.length}
          </span>
        </div>

        {notifications.length ? (
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                className="flex gap-3 px-4 py-3 no-underline border-b border-line last:border-b-0 hover:bg-surface-2"
              >
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${TONS[n.ton]}`}
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
          <div className="px-4 py-7 text-center text-[13px] text-muted">
            Rien à traiter pour l’instant.
          </div>
        )}
      </div>
    </details>
  );
}

/**
 * Bascule entre les trois espaces.
 *
 * Tant qu'il n'y a pas d'authentification, c'est ce sélecteur — et l'URL — qui
 * déterminent qui l'on est. Il disparaîtra le jour où l'on branchera une vraie
 * session : l'équipe n'aura alors accès qu'au back-office.
 */
function ChoixEspace() {
  const espaces: { cle: Space; href: string; libelle: string }[] = [
    { cle: "public", href: "/public", libelle: "Site" },
    { cle: "membre", href: "/membre", libelle: "Membre" },
    { cle: "admin", href: "/admin", libelle: "Admin" },
  ];
  return (
    <div className="mx-3.5 mb-1">
      <div className="text-[10.5px] text-white/35 mx-1 mb-1.5">
        Démonstration — changer d’espace
      </div>
      <div className="flex gap-0.5 p-[3px] rounded-lg bg-white/[0.06] border border-white/10">
        {espaces.map((e) => (
          <Link
            key={e.cle}
            href={e.href}
            className={`flex-1 text-center text-[12px] font-semibold px-2 py-1.5 rounded-md no-underline ${
              e.cle === "admin"
                ? "bg-white text-[#0f1d2c]"
                : "text-white/60 hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            {e.libelle}
          </Link>
        ))}
      </div>
    </div>
  );
}
