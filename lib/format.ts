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
