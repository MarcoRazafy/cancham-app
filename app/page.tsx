import Link from "next/link";
import { ArrowRight, Building2, Gauge, Globe } from "lucide-react";
import { Card } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";
import type { Space } from "@/lib/types";

/**
 * Point d'entrée de la maquette.
 *
 * Il n'y a pas d'authentification : on choisit son espace, et l'utilisateur de
 * démonstration correspondant est chargé depuis la base. Cette page disparaîtra
 * au profit d'un écran de connexion le jour où les sessions arriveront.
 */

const SPACES: {
  space: Space;
  href: string;
  label: string;
  icon: typeof Globe;
  desc: string;
  accent: string;
}[] = [
  {
    space: "public",
    href: "/public",
    label: "Espace public",
    icon: Globe,
    desc: "Vitrine de la chambre et formulaire d’adhésion. Accessible sans compte.",
    accent: "text-faint",
  },
  {
    space: "membre",
    href: "/membre",
    label: "Espace membre",
    icon: Building2,
    desc: "Annuaire, événements, actualités, messagerie et ressources, réservés aux entreprises adhérentes.",
    accent: "text-accent",
  },
  {
    space: "admin",
    href: "/admin",
    label: "Back-office",
    icon: Gauge,
    desc: "Pilotage de la vie associative : membres, cotisations, événements et publications.",
    accent: "text-navy",
  },
];

export default async function Home() {
  const users = await Promise.all(SPACES.map((s) => getCurrentUser(s.space)));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-14">
      <div className="text-center mb-9">
        <div className="font-[family-name:var(--font-display)] font-semibold text-[28px]">
          Can<span className="text-accent">Cham</span> Connect
        </div>
        <div className="text-[11px] tracking-[0.12em] uppercase text-faint mt-1.5">
          Chambre de Commerce et de Coopération Canada – Madagascar
        </div>
        <p className="text-muted text-[13.6px] max-w-[52ch] mx-auto mt-5">
          Maquette fonctionnelle, sans authentification pour l’instant. Choisissez un
          espace : un utilisateur de démonstration y est chargé automatiquement.
        </p>
      </div>

      <div className="grid gap-4 w-full max-w-[980px] md:grid-cols-3">
        {SPACES.map((s, i) => {
          const Icon = s.icon;
          const user = users[i];
          return (
            <Link key={s.href} href={s.href} className="no-underline group">
              <Card className="p-[22px] h-full flex flex-col hover:border-accent transition-colors">
                <Icon size={22} className={`${s.accent} mb-3`} />
                <h2 className="text-[17px] font-semibold m-0 mb-1.5">{s.label}</h2>
                <p className="text-[12.8px] text-muted leading-relaxed m-0 flex-1">
                  {s.desc}
                </p>
                <div className="mt-4 pt-3.5 border-t border-line">
                  <div className="text-[10.5px] uppercase tracking-[0.08em] text-faint font-semibold mb-1">
                    Utilisateur de démonstration
                  </div>
                  <div className="text-[13px] font-semibold">{user.nom}</div>
                  <div className="text-[11.5px] text-muted">{user.fonction}</div>
                </div>
                <div className="mt-3.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-accent">
                  Entrer
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <p className="text-[11.5px] text-faint mt-8 text-center max-w-[60ch]">
        Les entreprises, personnes et montants présentés sont fictifs et servent
        uniquement à illustrer le fonctionnement de l’application.
      </p>
    </div>
  );
}
