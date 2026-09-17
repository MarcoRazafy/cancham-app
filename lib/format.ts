import type { AttendeeStatus, InvoiceStatus, MemberStatus } from "@/lib/types";

/**
 * Date de référence de l'application.
 *
 * Le prototype figeait « aujourd'hui » au 2026-09-08, répété dans une dizaine
 * d'endroits. Ici la date réelle est utilisée, et ce point unique permet de la
 * forcer pour une démonstration via CANCHAM_TODAY (format YYYY-MM-DD).
 */
export function today(): Date {
  const override = process.env.CANCHAM_TODAY;
  if (override) return new Date(`${override}T00:00:00`);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Aujourd'hui en date ISO courte (YYYY-MM-DD), `CANCHAM_TODAY` compris. */
export function aujourdhuiISO(): string {
  const d = today();
  const deux = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
}

/**
 * Valeur à écrire dans une colonne `@db.Date`, ou à lui comparer.
 *
 * Prisma range une date au jour UTC de l'instant reçu. Minuit *local* à
 * Antananarivo (UTC+3) tombe la veille à 21 h UTC : la date enregistrée
 * reculait d'un jour. Minuit UTC donne le jour voulu, quel que soit le fuseau
 * du serveur. Sans argument : aujourd'hui.
 */
export function jourBase(iso: string = aujourdhuiISO()): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Une date saisie dans un champ `type="date"`, ou `null` si elle est invalide. */
export function jourSaisi(v: string): string | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
    ? v
    : null;
}

/** Convertit une date ISO courte (YYYY-MM-DD) en Date locale, sans décalage. */
export function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function isPast(iso: string): boolean {
  return parseISO(iso) < today();
}

export function fmtDate(
  iso: string,
  opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
): string {
  return parseISO(iso).toLocaleDateString("fr-FR", opts);
}

export function fmtDateShort(iso: string): string {
  return fmtDate(iso, { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Montants en Ariary, la devise de la chambre. */
export function fmtMoney(n: number): string {
  return `${n.toLocaleString("fr-FR")} Ar`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const STATUS_LABELS: Record<
  MemberStatus | InvoiceStatus | AttendeeStatus,
  string
> = {
  a_jour: "À jour",
  en_attente: "En attente de paiement",
  en_retard: "En retard",
  candidature: "Nouvelle demande",
  payee: "Payée",
  envoyee: "Envoyée",
  confirmé: "Confirmé",
  présent: "Présent",
  absent: "Absent",
};

export function statusLabel(
  s: MemberStatus | InvoiceStatus | AttendeeStatus,
): string {
  return STATUS_LABELS[s] ?? s;
}
