import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { estPortefeuille, type ModeReglement } from "@/lib/modes-reglement";

export type ModePaiement = "international" | "mobile_money";

export const MODES_PAIEMENT: Record<ModePaiement, string> = {
  international: "Carte bancaire",
  mobile_money: "MVola, Orange Money, Airtel Money",
};

export function estModePaiement(v: string): v is ModePaiement {
  return v === "international" || v === "mobile_money";
}

export function canalVanillaPay(mode: ModeReglement): ModePaiement | null {
  if (mode === "carte") return "international";
  return estPortefeuille(mode) ? "mobile_money" : null;
}

interface Config {
  base: string;
  clientId: string;
  clientSecret: string;
  keySecret: string;
  version: string;
}

const VERSION = "2023-01-12";

export const MONTANT_MINIMUM_EN_LIGNE = 5000;

function config(): Config | null {
  const base = process.env.VANILLAPAY_BASE?.trim().replace(/\/+$/, "");
  const clientId = process.env.VANILLAPAY_CLIENT_ID?.trim();
  const clientSecret = process.env.VANILLAPAY_CLIENT_SECRET?.trim();
  const keySecret = process.env.VANILLAPAY_KEY_SECRET?.trim();
  if (!base || !clientId || !clientSecret || !keySecret) return null;
  return {
    base,
    clientId,
    clientSecret,
    keySecret,
    version: process.env.VANILLAPAY_VERSION?.trim() || VERSION,
  };
}

export function vanillaPayActif(): boolean {
  return config() !== null;
}

export function marchandAffiche(): string | null {
  return process.env.VANILLAPAY_MARCHAND?.trim() || null;
}

export function mobileMoneyEnLigne(): boolean {
  return (
    vanillaPayActif() &&
    (simulateurActif() || process.env.VANILLAPAY_MOBILE_MONEY?.trim() === "1")
  );
}

interface Reponse<T> {
  CodeRetour?: number;
  DescRetour?: string;
  DetailRetour?: string;
  Data?: T | null;
}

const motif = (d: Reponse<unknown>) =>
  [d.CodeRetour, d.DescRetour, d.DetailRetour].filter(Boolean).join(" · ");

async function lire<T>(
  r: Response,
  quoi: string,
): Promise<{ d: Reponse<T> | null; detail: string | null }> {
  const brut = await r.text();
  let d: Reponse<T>;
  try {
    d = JSON.parse(brut) as Reponse<T>;
  } catch {
    console.error(
      `[vanillapay] ${quoi} : réponse illisible (${r.status}) : ${brut.slice(0, 300)}`,
    );
    return { d: null, detail: null };
  }
  if (!r.ok || (d.CodeRetour !== undefined && d.CodeRetour !== 200)) {
    console.error(
      `[vanillapay] ${quoi} refusé (${r.status}) : ${motif(d) || brut.slice(0, 300)}`,
    );
    return { d: null, detail: d.DetailRetour?.trim() || null };
  }
  return { d, detail: null };
}

async function jeton(c: Config): Promise<string | null> {
  try {
    const r = await fetch(`${c.base}/webpayment/token`, {
      headers: {
        Accept: "*/*",
        "Client-Id": c.clientId,
        "Client-Secret": c.clientSecret,
        "VPI-Version": c.version,
      },
      cache: "no-store",
    });
    const { d } = await lire<{ Token?: string }>(r, "jeton");
    const t = d?.Data?.Token?.trim();
    if (!t) return null;
    return /^bearer /i.test(t) ? t : `Bearer ${t}`;
  } catch (e) {
    console.error("[vanillapay] jeton injoignable :", e);
    return null;
  }
}

export function referencePaiement(numeroFacture: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffixe = "";
  for (const n of randomBytes(6)) suffixe += alphabet[n % alphabet.length];
  return `${numeroFacture}-${suffixe}`;
}

export interface OuvertureRefusee {
  raison: string;
}

export function referenceDuLien(url: string): string | null {
  try {
    const id = new URL(url).searchParams.get("id");
    const contenu = id?.split(".")[1];
    if (!contenu) return id ?? null;
    const lu = Buffer.from(contenu, "base64url").toString("utf8").trim();
    return /^[A-Za-z0-9_-]{6,40}$/.test(lu) ? lu : id;
  } catch {
    return null;
  }
}

const PANIER_MAX = 20;

export async function ouvrirPaiement(v: {
  montant: number;
  reference: string;
  panier: string;
  mode: ModePaiement;
  notifUrl: string;
  redirectUrl: string;
}): Promise<{ url: string; id: string | null } | OuvertureRefusee> {
  const c = config();
  if (!c) return { raison: "Le paiement en ligne n’est pas configuré." };

  const t = await jeton(c);
  if (!t) return { raison: "Le prestataire de paiement ne répond pas." };

  try {
    const r = await fetch(`${c.base}/api/webpayment/v2/initiate`, {
      method: "POST",
      headers: {
        Accept: "*/*",
        Authorization: t,
        "VPI-Version": c.version,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        montant: v.montant,
        reference: v.reference,
        panier: v.panier.slice(0, PANIER_MAX),
        notif_url: v.notifUrl,
        redirect_url: v.redirectUrl,
        devise: "MGA",
        mode_paiement: v.mode,
      }),
      cache: "no-store",
    });
    const { d, detail } = await lire<{ url?: string }>(r, "ouverture");
    const url = d?.Data?.url;
    if (!url) {
      if (d)
        console.error("[vanillapay] ouverture : réponse sans lien de paiement");
      if (detail && /mobile money/i.test(detail)) {
        return {
          raison:
            "Le paiement mobile money en ligne n’est pas encore ouvert sur le compte de la chambre : faites l’envoi depuis votre téléphone, comme indiqué.",
        };
      }
      return {
        raison:
          detail && /montant/i.test(detail)
            ? `Le prestataire refuse ce montant : ${detail.replace(/\.$/, "")}. Choisissez un autre moyen de paiement.`
            : "Le paiement n’a pas pu être ouvert.",
      };
    }
    return { url, id: referenceDuLien(url) };
  } catch (e) {
    console.error("[vanillapay] ouverture injoignable :", e);
    return { raison: "Le prestataire de paiement ne répond pas." };
  }
}

export interface EtatPaiement {
  reference: string;
  reussi: boolean;
  echoue: boolean;
  montant: number | null;
  transaction: string | null;
}

const REUSSI = [
  "success",
  "successful",
  "succes",
  "succès",
  "paid",
  "payee",
  "payé",
  "completed",
  "reussi",
  "réussi",
];
const ECHOUE = [
  "failed",
  "fail",
  "failure",
  "echec",
  "échec",
  "error",
  "refused",
  "refuse",
  "refusé",
  "rejected",
  "canceled",
  "cancelled",
  "annule",
  "annulé",
  "expired",
  "timeout",
];

export function lireEtat(charge: unknown): EtatPaiement | null {
  if (!charge || typeof charge !== "object") return null;
  const o = charge as Record<string, unknown>;
  const d = (o.Data ?? o.data ?? o) as Record<string, unknown>;
  if (!d || typeof d !== "object") return null;

  const reference = String(d.reference ?? d.ref ?? o.reference ?? "").trim();
  if (!reference) return null;

  const statut = String(d.etat ?? d.status ?? d.statut ?? d.state ?? "")
    .trim()
    .toLowerCase();
  const devise = String(d.devise ?? d.currency ?? "")
    .trim()
    .toUpperCase();
  const montant =
    d.montant_mga !== undefined && d.montant_mga !== null
      ? Number(d.montant_mga)
      : devise === "MGA"
        ? Number(d.montant ?? d.amount)
        : NaN;
  const transaction =
    d.reference_VPI ??
    d.referenceVPI ??
    d.transaction_id ??
    d.id ??
    d.transaction;

  return {
    reference,
    reussi: REUSSI.includes(statut),
    echoue: ECHOUE.includes(statut),
    montant: Number.isFinite(montant) ? montant : null,
    transaction: transaction ? String(transaction) : null,
  };
}

export function chargeDepuisCorps(corps: string): unknown {
  try {
    return JSON.parse(corps);
  } catch {
    const champs = Object.fromEntries(new URLSearchParams(corps));
    return Object.keys(champs).length ? champs : null;
  }
}

export function signerCorps(corps: string): string | null {
  const c = config();
  if (!c) return null;
  return createHmac("sha256", c.keySecret)
    .update(corps, "utf8")
    .digest("hex")
    .toUpperCase();
}

export function signatureValide(
  corps: string,
  signature: string | null,
): boolean {
  const attendue = signerCorps(corps);
  if (!attendue || !signature) return false;
  const recue = signature.trim().toUpperCase();
  if (recue.length !== attendue.length) return false;

  return timingSafeEqual(
    Buffer.from(attendue, "utf8"),
    Buffer.from(recue, "utf8"),
  );
}

export function identifiantsValides(
  clientId: string | null,
  clientSecret: string | null,
): boolean {
  const c = config();
  if (!c || !clientId || !clientSecret) return false;
  const a = Buffer.from(`${clientId}\n${clientSecret}`, "utf8");
  const b = Buffer.from(`${c.clientId}\n${c.clientSecret}`, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function simulateurActif(): boolean {
  const base = process.env.VANILLAPAY_BASE?.trim().replace(/\/+$/, "") ?? "";
  return (
    process.env.NODE_ENV !== "production" &&
    /\/api\/bac-a-sable\/vanillapay$/.test(base) &&
    vanillaPayActif()
  );
}

export async function interrogerStatut(
  id: string,
  mode: ModePaiement,
): Promise<EtatPaiement | null> {
  const c = config();
  if (!c) return null;
  const t = await jeton(c);
  if (!t) return null;

  try {
    const r = await fetch(
      `${c.base}/api/webpayment/v2/status/${encodeURIComponent(id)}?mode_paiement=${mode}`,
      {
        headers: { Accept: "*/*", Authorization: t, "VPI-Version": c.version },
        cache: "no-store",
      },
    );
    const { d } = await lire<Record<string, unknown>>(r, "statut");
    return d ? lireEtat(d) : null;
  } catch (e) {
    console.error("[vanillapay] statut injoignable :", e);
    return null;
  }
}
