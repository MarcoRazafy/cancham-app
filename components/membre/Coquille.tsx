"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { Bell, ChevronDown, Menu, Search, Sun } from "lucide-react";
import { NAV_ICONS } from "@/components/nav-icons";
import { TITLES, type NavGroup } from "@/lib/nav";
import type { Notification } from "@/lib/notifications";
import type { Member, User } from "@/lib/types";

interface CoquilleProps {
  user: User;
  membre: Member;
  nav: NavGroup[];
  /** Compteurs affichés à droite des entrées de menu. Clé = href. */
  badges?: Record<string, number>;
  /** Entrées inertes tant que l'adhésion n'est pas effective. */
  lockedHrefs?: string[];
  notifications?: Notification[];
  children: ReactNode;
}

/**
 * Coquille de l'espace membre.
 *
 * Barre latérale en dégradé bordeaux vers nuit, barre supérieure avec fil
 * d'Ariane, recherche et raccourcis. La palette vient du bloc `.espace-membre`
 * de globals.css, qui redéfinit les tokens applicatifs : les pages internes
 * s'y conforment sans modification.
 */
export function Coquille({
  user,
  membre,
  nav,
  badges = {},
  lockedHrefs = [],
  notifications = [],
  children,
}: CoquilleProps) {
  const pathname = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);

  const [fil, titre] = TITLES[pathname] ?? ["Espace membre", ""];

  return (
    <div className="espace-membre flex min-h-screen">
      {menuOuvert ? (
        <button
          aria-label="Fermer le menu"
          onClick={() => setMenuOuvert(false)}
          className="fixed inset-0 bg-black/55 z-35 lg:hidden"
        />
      ) : null}

      {/* ==================== Barre latérale ==================== */}
      <aside
        className={`w-[274px] shrink-0 flex flex-col fixed inset-y-0 left-0 z-40 transition-transform duration-200 ${
          menuOuvert ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        style={{ background: "var(--laterale)" }}
      >
        <div className="px-6 pt-7 pb-6">
          <Link href="/membre" className="no-underline block">
            <div className="titre text-[26px] leading-[1.06] text-white">
              CanCham
              <br />
              Connect
            </div>
            <div className="text-[10px] tracking-[0.18em] uppercase text-white/55 mt-2">
              Canada · Madagascar
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3.5 pb-4">
          {nav.map((groupe, i) => (
            <div
              key={groupe.label || `groupe-${i}`}
              className={i > 0 ? "mt-5 pt-5 border-t border-white/10" : ""}
            >
              {groupe.label ? (
                <div className="surtitre text-white/40 mx-3 mb-2.5">{groupe.label}</div>
              ) : null}

              {groupe.items.map((item) => {
                const Icone = NAV_ICONS[item.icon] ?? NAV_ICONS.home;
                const Cadenas = NAV_ICONS.lock;
                const cible = item.href.split("?")[0];
                const actif =
                  pathname === cible ||
                  (cible !== "/membre" && pathname.startsWith(`${cible}/`));
                const verrouille = lockedHrefs.includes(item.href);
                const badge = badges[item.href];

                if (verrouille) {
                  return (
                    <span
                      key={item.href}
                      title="Accès disponible après validation de votre adhésion"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] opacity-35 cursor-not-allowed"
                    >
                      <Cadenas size={18} className="shrink-0" />
                      <span>{item.label}</span>
                    </span>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOuvert(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] no-underline transition-colors ${
                      actif
                        ? "bg-white/[0.13] text-white font-semibold"
                        : "text-white/72 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    <Icone size={18} className="shrink-0 opacity-90" />
                    <span className="flex-1">{item.label}</span>
                    {badge ? (
                      <span className="text-[11px] font-bold w-[22px] h-[22px] rounded-full bg-accent text-white flex items-center justify-center">
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <Link
          href="/membre/profil"
          className="mx-3.5 mb-5 mt-1 px-3 py-3 rounded-lg flex items-center gap-3 border-t border-white/10 pt-4 no-underline hover:bg-white/[0.06]"
        >
          <Avatar initiales={user.initiales} taille={40} />
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-semibold text-white truncate">
              {abreger(user.nom)}
            </span>
            <span className="block text-[11.5px] text-white/50 truncate">{membre.nom}</span>
          </span>
          <ChevronDown size={16} className="text-white/45 shrink-0" />
        </Link>
      </aside>

      {/* ==================== Contenu ==================== */}
      <div className="flex-1 min-w-0 flex flex-col lg:ml-[274px]">
        <header className="sticky top-0 z-30 bg-bg/92 backdrop-blur-md border-b border-line flex items-center gap-4 px-4 md:px-7 py-3">
          <button
            onClick={() => setMenuOuvert((v) => !v)}
            aria-label="Ouvrir le menu"
            className="lg:hidden border border-line bg-surface rounded-lg p-2 cursor-pointer"
          >
            <Menu size={18} />
          </button>

          <div className="text-[13px] text-faint whitespace-nowrap hidden sm:block">
            {fil} <span className="mx-1.5 opacity-50">/</span>
            <span className="text-ink font-medium">{titre}</span>
          </div>

          <Suspense fallback={<div className="flex-1" />}>
            <Recherche />
          </Suspense>

          <div className="flex items-center gap-2 shrink-0">
            <BoutonIcone label="Thème clair">
              <Sun size={17} />
            </BoutonIcone>

            <Link
              href="/membre#notifications"
              aria-label={`Notifications (${notifications.length})`}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 no-underline"
            >
              <Bell size={17} />
              {notifications.length ? (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent border-2 border-bg" />
              ) : null}
            </Link>

            <span className="hidden md:flex items-center gap-1 text-[13px] font-semibold text-muted px-2">
              FR <ChevronDown size={14} />
            </span>

            <Avatar initiales={user.initiales} taille={36} />
          </div>
        </header>

        <main className="px-4 md:px-7 pt-7 pb-16 max-w-[1240px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

/** « Voninkazo Andriamampianina » devient « Voninkazo A. ». */
function abreger(nom: string): string {
  const mots = nom.trim().split(/\s+/);
  if (mots.length < 2) return nom;
  return `${mots[0]} ${mots[mots.length - 1][0]}.`;
}

function Avatar({ initiales, taille }: { initiales: string; taille: number }) {
  return (
    <span
      className="rounded-full flex items-center justify-center font-bold shrink-0 bg-accent-soft text-accent-strong border border-accent/40"
      style={{ width: taille, height: taille, fontSize: taille * 0.36 }}
    >
      {initiales}
    </span>
  );
}

function BoutonIcone({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      title={label}
      aria-label={label}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 cursor-pointer"
    >
      {children}
    </button>
  );
}

/** Recherche transversale, en formulaire GET : partageable et sans JavaScript. */
function Recherche() {
  const pathname = usePathname();
  const params = useSearchParams();
  const surRecherche = pathname === "/membre/recherche";

  return (
    <form action="/membre/recherche" className="flex-1 flex justify-center px-2">
      <div className="relative w-full max-w-[420px]">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
        />
        <input
          type="search"
          name="q"
          defaultValue={surRecherche ? (params.get("q") ?? "") : ""}
          placeholder="Rechercher dans le réseau…"
          aria-label="Rechercher dans le réseau"
          className="w-full border border-line bg-surface text-ink placeholder:text-faint rounded-lg pl-10 pr-3 py-2.5 text-[13.5px] outline-none focus:border-accent"
        />
      </div>
    </form>
  );
}
