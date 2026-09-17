import Link from "next/link";
import {
  CalendarDays,
  CreditCard,
  FileText,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { actionJournal, lienJournal, type FamilleJournal } from "@/lib/journal";
import type { EntreeJournal } from "@/lib/queries-admin";

const ICONES: Record<FamilleJournal, LucideIcon> = {
  adhesion: UserRound,
  finance: CreditCard,
  programme: CalendarDays,
  contenu: FileText,
};

const TONS = {
  ok: "bg-success-soft text-success-strong",
  bad: "bg-accent-soft text-accent-strong",
  info: "bg-navy-soft text-navy",
} as const;

/** « il y a 5 min », « il y a 3 h », « hier à 14:02 », « 12 sept. à 09:30 ». */
export function ilYa(iso: string, maintenant = new Date()): string {
  const d = new Date(iso);
  const minutes = Math.round((maintenant.getTime() - d.getTime()) / 60_000);
  if (minutes < 1) return "à l’instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (minutes < 60 * 12) return `il y a ${Math.round(minutes / 60)} h`;
  const heure = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const jour = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const ecart = Math.round((jour(maintenant) - jour(d)) / 86_400_000);
  if (ecart === 0) return `aujourd’hui à ${heure}`;
  if (ecart === 1) return `hier à ${heure}`;
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", ...(d.getFullYear() !== maintenant.getFullYear() ? { year: "numeric" } : {}) })} à ${heure}`;
}

/** Une opération du journal : ce qui s'est passé, sur quoi, par qui, quand. */
export function LigneJournal({
  entree,
  compacte = false,
}: {
  entree: EntreeJournal;
  compacte?: boolean;
}) {
  const action = actionJournal(entree.action);
  const Icone = ICONES[action.famille];
  const lien = lienJournal(entree.action, entree.entite, entree.entiteId);

  const contenu = (
    <>
      <span
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${TONS[action.ton]}`}
      >
        <Icone size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-[13.5px] font-semibold text-ink">
            {action.libelle}
          </span>
          <span className="text-[11.5px] text-faint whitespace-nowrap">
            {ilYa(entree.date)}
          </span>
        </span>
        {entree.detail ? (
          <span
            className={`block text-[12.8px] text-muted ${compacte ? "truncate" : ""}`}
          >
            {entree.detail}
          </span>
        ) : null}
        {compacte ? null : (
          <span className="block text-[11.5px] text-faint mt-0.5">
            Par {entree.acteur}
          </span>
        )}
      </span>
    </>
  );

  const classes =
    "flex gap-3 items-start py-3 border-b border-line last:border-b-0 no-underline";
  return lien ? (
    <Link
      href={lien}
      className={`${classes} group hover:bg-surface-2 -mx-2 px-2 rounded-md`}
    >
      {contenu}
    </Link>
  ) : (
    <div className={classes}>{contenu}</div>
  );
}
