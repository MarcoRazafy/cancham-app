import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { estPortefeuille, type ModeReglement } from "@/lib/modes-reglement";

/**
 * Vanilla Pay International — l'encaissement en ligne des cotisations.
 *
 * Le membre ne saisit jamais sa carte chez nous : on ouvre un paiement chez
 * eux, on l'envoie sur leur page, et ils nous rappellent. C'est leur
 * certification qui porte les données bancaires, pas la nôtre.
 *
 * Deux choses seulement font foi :
 *  - la notification signée qu'ils envoient à `notif_url`. Le retour du
 *    navigateur ne prouve rien : un membre peut fabriquer cette adresse.
 *  - à défaut, l'interrogation du statut, qu'on fait depuis le serveur.
 *
 * Sans clés (`VANILLAPAY_*`), rien n'est proposé au membre : le bouton
 * disparaît et les règlements se saisissent au back-office comme avant.
 *
 * L'Ariary uniquement : Vanilla Pay n'encaisse pas le dollar canadien. Les
 * formules canadiennes se règlent par virement, et l'équipe les enregistre.
 */

/** Modes d'encaissement : carte bancaire, ou portefeuille mobile malgache. */
export type ModePaiement = "international" | "mobile_money";

export const MODES_PAIEMENT: Record<ModePaiement, string> = {
  international: "Carte bancaire",
  mobile_money: "MVola, Orange Money, Airtel Money",
};

export function estModePaiement(v: string): v is ModePaiement {
  return v === "international" || v === "mobile_money";
}

/**
 * Notre moyen de règlement, dit dans le vocabulaire du prestataire.
 *
 * Vanilla Pay ne connaît que deux canaux : la carte et le portefeuille
 * mobile — l'opérateur se choisit sur leur page. Nous, nous gardons le
 * moyen exact que le membre a coché, pour que l'équipe sache où chercher.
 * `null` : ce moyen ne passe pas par eux.
 */
export function canalVanillaPay(mode: ModeReglement): ModePaiement | null {
  if (mode === "carte") return "international";
  return estPortefeuille(mode) ? "mobile_money" : null;
}

interface Config {
  base: string;
  keyID: string;
  keySECRET: string;
}

/**
 * La configuration, ou `null` si la chambre n'a pas encore ses clés.
 *
 * L'adresse de l'API vient de l'environnement elle aussi : le bac à sable et
 * la production n'ont pas le même hôte, et rien ne doit obliger à redéployer
 * pour passer de l'un à l'autre.
 */
function config(): Config | null {
  const base = process.env.VANILLAPAY_BASE?.trim().replace(/\/+$/, "");
  const keyID = process.env.VANILLAPAY_KEY_ID?.trim();
  const keySECRET = process.env.VANILLAPAY_KEY_SECRET?.trim();
  if (!base || !keyID || !keySECRET) return null;
  return { base, keyID, keySECRET };
}

export function vanillaPayActif(): boolean {
  return config() !== null;
}

/**
 * Le jeton d'appel, valable vingt minutes.
 *
 * On en redemande un à chaque paiement plutôt que d'en garder un au chaud :
 * un jeton périmé au mauvais moment coûte plus cher que cet appel-là.
 */
async function jeton(c: Config): Promise<string | null> {
  try {
    const r = await fetch(`${c.base}/webpayment/token`, {
      // Noms repris de leur documentation. À confirmer au premier essai dans
      // le bac à sable : c'est le seul endroit à corriger si elle diffère.
      headers: { keyID: c.keyID, keySECRET: c.keySECRET },
      cache: "no-store",
    });
    if (!r.ok) {
      console.error(
        `[vanillapay] jeton refusé (${r.status}) : ${await r.text()}`,
      );
      return null;
    }
    const d = (await r.json()) as { token?: string; data?: { token?: string } };
    return d.token ?? d.data?.token ?? null;
  } catch (e) {
    console.error("[vanillapay] jeton injoignable :", e);
    return null;
  }
}

/**
 * La référence d'une tentative : le numéro de la facture, et un suffixe.
 *
 * Le numéro pour retrouver la pièce d'un coup d'œil dans leur tableau de
 * bord ; le suffixe parce qu'une facture peut être tentée plusieurs fois, et
 * qu'ils refusent deux paiements sous la même référence.
 */
export function referencePaiement(numeroFacture: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffixe = "";
  for (const n of randomBytes(6)) suffixe += alphabet[n % alphabet.length];
  return `${numeroFacture}-${suffixe}`;
}

export interface OuvertureRefusee {
  raison: string;
}

/**
 * Ouvre un paiement et rend l'adresse de la page où envoyer le membre.
 *
 * Le montant part en unités entières d'Ariary, comme il est facturé. La
 * référence est la nôtre : c'est elle qui reviendra dans la notification.
 */
export async function ouvrirPaiement(v: {
  montant: number;
  reference: string;
  libelle: string;
  mode: ModePaiement;
  notifUrl: string;
  redirectUrl: string;
}): Promise<{ url: string } | OuvertureRefusee> {
  const c = config();
  if (!c) return { raison: "Le paiement en ligne n’est pas configuré." };

  const t = await jeton(c);
  if (!t) return { raison: "Le prestataire de paiement ne répond pas." };

  try {
    const r = await fetch(`${c.base}/api/webpayment/v2/initiate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        montant: v.montant,
        reference: v.reference,
        panier: [{ nom: v.libelle, quantite: 1, prix: v.montant }],
        notif_url: v.notifUrl,
        redirect_url: v.redirectUrl,
        devise: "MGA",
        mode_paiement: v.mode,
      }),
      cache: "no-store",
    });
    const brut = await r.text();
    if (!r.ok) {
      console.error(`[vanillapay] ouverture refusée (${r.status}) : ${brut}`);
      return { raison: "Le paiement n’a pas pu être ouvert." };
    }
    const d = JSON.parse(brut) as {
      url?: string;
      payment_url?: string;
      data?: { url?: string; payment_url?: string };
    };
    const url = d.url ?? d.payment_url ?? d.data?.url ?? d.data?.payment_url;
    if (!url) {
      console.error(`[vanillapay] réponse sans adresse de paiement : ${brut}`);
      return { raison: "Le paiement n’a pas pu être ouvert." };
    }
    return { url };
  } catch (e) {
    console.error("[vanillapay] ouverture injoignable :", e);
    return { raison: "Le prestataire de paiement ne répond pas." };
  }
}

/** Ce qu'une notification ou une interrogation de statut nous apprend. */
export interface EtatPaiement {
  reference: string;
  /** Vrai seulement quand l'argent est encaissé. */
  reussi: boolean;
  /** Échec constaté : la tentative est close, le membre peut recommencer. */
  echoue: boolean;
  montant: number | null;
  transaction: string | null;
}

/**
 * Lit l'état d'un paiement dans une charge utile du prestataire.
 *
 * Leurs champs varient d'un point d'entrée à l'autre ; on accepte les formes
 * connues et on refuse de conclure sur ce qu'on ne comprend pas — un
 * paiement qu'on ne sait pas lire reste en cours, jamais réussi.
 */
export function lireEtat(charge: unknown): EtatPaiement | null {
  if (!charge || typeof charge !== "object") return null;
  const o = charge as Record<string, unknown>;
  const d = (o.data ?? o) as Record<string, unknown>;

  const reference = String(d.reference ?? d.ref ?? o.reference ?? "").trim();
  if (!reference) return null;

  const statut = String(d.status ?? d.statut ?? d.state ?? "").toLowerCase();
  const montant = Number(d.montant ?? d.amount);
  const transaction = d.transaction_id ?? d.id ?? d.transaction;

  return {
    reference,
    reussi: [
      "success",
      "succes",
      "succès",
      "paid",
      "payee",
      "payé",
      "completed",
    ].includes(statut),
    echoue: [
      "failed",
      "echec",
      "échec",
      "refused",
      "refuse",
      "refusé",
      "canceled",
      "cancelled",
      "annule",
      "annulé",
    ].includes(statut),
    montant: Number.isFinite(montant) ? montant : null,
    transaction: transaction ? String(transaction) : null,
  };
}

/**
 * Vérifie la signature d'une notification.
 *
 * `VPI-Signature` porte le HMAC-SHA256 du corps **brut** de la requête,
 * calculé avec la clé secrète, en hexadécimal majuscule. Le corps doit être
 * lu tel qu'il est arrivé : le relire après un `JSON.parse` changerait un
 * espace ou l'ordre des clés, et la signature ne tomberait plus juste.
 *
 * La comparaison est à temps constant. Une comparaison ordinaire s'arrête au
 * premier caractère différent, et ce temps-là se mesure : on peut deviner une
 * signature valide octet par octet.
 */
export function signatureValide(
  corps: string,
  signature: string | null,
): boolean {
  const c = config();
  if (!c || !signature) return false;

  const attendue = createHmac("sha256", c.keySECRET)
    .update(corps, "utf8")
    .digest("hex")
    .toUpperCase();
  const recue = signature.trim().toUpperCase();
  if (recue.length !== attendue.length) return false;

  return timingSafeEqual(
    Buffer.from(attendue, "utf8"),
    Buffer.from(recue, "utf8"),
  );
}

/** Interroge le prestataire quand sa notification ne nous est pas parvenue. */
export async function interrogerStatut(
  transactionOuReference: string,
  mode: ModePaiement,
): Promise<EtatPaiement | null> {
  const c = config();
  if (!c) return null;
  const t = await jeton(c);
  if (!t) return null;

  try {
    const r = await fetch(
      `${c.base}/api/webpayment/v2/status/${encodeURIComponent(transactionOuReference)}?mode_paiement=${mode}`,
      { headers: { Authorization: `Bearer ${t}` }, cache: "no-store" },
    );
    if (!r.ok) return null;
    return lireEtat(await r.json());
  } catch (e) {
    console.error("[vanillapay] statut injoignable :", e);
    return null;
  }
}
