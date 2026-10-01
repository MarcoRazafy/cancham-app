import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { estPortefeuille, type ModeReglement } from "@/lib/modes-reglement";

/**
 * Vanilla Pay International — l'encaissement en ligne.
 *
 * Le membre ne saisit jamais sa carte ni son code secret chez nous : on
 * ouvre un paiement chez eux, on l'envoie sur leur page, et ils nous
 * rappellent. C'est leur certification qui porte les données de paiement,
 * pas la nôtre.
 *
 * Trois appels, ceux de leur document d'intégration (version 2.3) :
 *  - `GET  /webpayment/token`                le jeton, avec `Client-Id` et
 *                                            `Client-Secret` ;
 *  - `POST /api/webpayment/v2/initiate`      ouvre le paiement, dans un
 *                                            mode — carte ou mobile money —,
 *                                            et rend son lien ;
 *  - `GET  /api/webpayment/v2/status/{id}`   l'état d'un paiement, par sa
 *                                            référence chez eux.
 * Leurs réponses arrivent toutes dans la même enveloppe : `CodeRetour`,
 * `DescRetour`, `DetailRetour` et `Data`.
 *
 * Deux choses seulement font foi :
 *  - la notification signée qu'ils envoient à `notif_url`. Le retour du
 *    navigateur ne prouve rien : un membre peut fabriquer cette adresse.
 *  - à défaut, l'interrogation du statut, qu'on fait depuis le serveur.
 *
 * Sans les quatre variables `VANILLAPAY_*`, rien n'est proposé au membre :
 * le bouton disparaît et les règlements se constatent au back-office.
 *
 * L'Ariary uniquement : les formules canadiennes se règlent par virement,
 * et l'équipe les enregistre.
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
 * Sur leur page, le payeur choisit lui-même la carte ou son opérateur.
 * Nous, nous gardons le moyen exact que le membre a coché, pour que
 * l'équipe sache où chercher. `null` : ce moyen ne passe pas par eux.
 */
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

/** La version de leur API que nous parlons, à défaut d'une autre. */
const VERSION = "2023-01-12";

/**
 * En deçà, le prestataire refuse d'ouvrir un paiement : son plancher vaut
 * un euro, soit un peu moins de 5 000 Ar. Sous ce montant, on ne propose
 * pas le paiement en ligne — le membre règle par les autres moyens.
 */
export const MONTANT_MINIMUM_EN_LIGNE = 5000;

/**
 * La configuration, ou `null` si la chambre n'a pas encore ses accès.
 *
 * Ce que leur espace marchand remet : un identifiant client et son secret,
 * qui ouvrent l'API, et une clé secrète (« KeySecret »), qui signe leurs
 * notifications. L'adresse de l'API vient de l'environnement elle aussi :
 * la préproduction (`https://preprod.vanilla-pay.net`) et la production
 * (`https://bo.vanilla-pay.net`) n'ont pas le même hôte, et rien ne doit
 * obliger à redéployer pour passer de l'une à l'autre.
 */
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

/**
 * Le nom que le prestataire affiche au payeur, quand ce n'est pas celui de
 * la chambre : le compte marchand peut être ouvert au nom de la société qui
 * encaisse pour elle. On le dit au membre avant qu'il parte payer — un nom
 * inconnu sur la page de paiement, puis sur son relevé, le ferait hésiter.
 * `null` : rien à signaler.
 */
export function marchandAffiche(): string | null {
  return process.env.VANILLAPAY_MARCHAND?.trim() || null;
}

/**
 * Le compte marchand encaisse-t-il le mobile money ?
 *
 * Le mobile money est une offre à part chez eux : un compte qui ne l'a pas
 * se voit répondre « Vous n'avez pas accès à l'offre mobile money » à
 * l'ouverture du paiement. Promettre « votre téléphone va sonner » à un
 * membre pour le lui refuser l'instant d'après serait le tromper ; « Payer
 * maintenant » n'apparaît donc dans les tunnels MVola, Orange Money et
 * Airtel Money que si la chambre déclare l'offre activée
 * (`VANILLAPAY_MOBILE_MONEY=1`). Le simulateur, lui, la joue toujours.
 */
export function mobileMoneyEnLigne(): boolean {
  return (
    vanillaPayActif() &&
    (simulateurActif() || process.env.VANILLAPAY_MOBILE_MONEY?.trim() === "1")
  );
}

/** L'enveloppe de toutes leurs réponses. */
interface Reponse<T> {
  CodeRetour?: number;
  DescRetour?: string;
  DetailRetour?: string;
  Data?: T | null;
}

/** Ce qu'ils disent d'un refus, pour les journaux du serveur. */
const motif = (d: Reponse<unknown>) =>
  [d.CodeRetour, d.DescRetour, d.DetailRetour].filter(Boolean).join(" · ");

/**
 * Lit une réponse : son enveloppe si elle est acceptée ; sinon `null`, une
 * ligne aux journaux, et le détail qu'ils donnent du refus. Un `CodeRetour`
 * autre que 200 est un refus, même quand la réponse HTTP dit 200.
 */
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

/**
 * Le jeton d'appel, valable vingt minutes.
 *
 * On en redemande un à chaque paiement plutôt que d'en garder un au chaud :
 * un jeton périmé au mauvais moment coûte plus cher que cet appel-là. Il
 * part ensuite tel quel dans `Authorization` ; s'il arrive sans son
 * « Bearer », on le lui met.
 */
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
 * La référence de la transaction chez eux (« VPI… » pour une carte, « MM… »
 * pour un portefeuille), telle que la porte le lien de paiement : son `id`
 * est un jeton signé dont le contenu est cette référence. `null` si le lien
 * ne se lit pas ainsi.
 */
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

/** Au-delà, ils répondent « Panier trop long ». */
const PANIER_MAX = 20;

/**
 * Ouvre un paiement et rend l'adresse de la page où envoyer le membre, avec
 * la référence de la transaction chez eux : c'est elle qu'on présentera pour
 * demander l'état du paiement si la notification ne nous parvient pas.
 *
 * Le montant part en unités entières d'Ariary, comme il est facturé. La
 * référence est la nôtre : c'est elle qui reviendra dans la notification.
 * Le « panier » est ce que le payeur règle — le numéro de la facture. Le
 * mode décide de leur page : `international` propose la carte (et PayPal
 * si le compte l'a), `mobile_money` les trois portefeuilles.
 *
 * Leurs adresses de notification et de retour doivent appartenir au site
 * déclaré dans leur espace marchand, quand il y en a un.
 */
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
      if (d) console.error("[vanillapay] ouverture : réponse sans lien de paiement");
      // Deux refus regardent le membre : un montant hors de leurs bornes, et
      // un compte marchand sans l'offre mobile money. Le reste, non.
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

/** Ce qu'une notification ou une interrogation de statut nous apprend. */
export interface EtatPaiement {
  reference: string;
  /** Vrai seulement quand l'argent est encaissé. */
  reussi: boolean;
  /** Échec constaté : la tentative est close, le membre peut recommencer. */
  echoue: boolean;
  /**
   * Le montant annoncé, quand il l'est en Ariary : leur champ `montant_mga`,
   * présent pour un paiement ouvert en Ariary. Leur `montant`, lui, est en
   * euros pour une carte et net de frais pour un portefeuille : il ne se
   * compare pas à ce que nous avons demandé — sans Ariary, c'est `null`.
   */
  montant: number | null;
  transaction: string | null;
}

const REUSSI = ["success", "successful", "succes", "succès", "paid", "payee", "payé", "completed", "reussi", "réussi"];
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

/**
 * Lit l'état d'un paiement dans une charge utile du prestataire.
 *
 * La notification porte `reference_VPI`, `reference`, `panier`, `montant`
 * et `etat` — plus `montant_mga` pour une carte, `initiateur` et
 * `referenceMM` pour un portefeuille. L'interrogation du statut rend les
 * mêmes champs dans `Data`, avec `montantRecu`. Les états : `INITIATED`
 * (ouvert, pas encore payé), `PENDING`, `SUCCESS`, `FAILED`.
 *
 * On accepte aussi les variantes connues, et on refuse de conclure sur ce
 * qu'on ne comprend pas — un paiement qu'on ne sait pas lire reste en
 * cours, jamais réussi.
 */
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
    d.reference_VPI ?? d.referenceVPI ?? d.transaction_id ?? d.id ?? d.transaction;

  return {
    reference,
    reussi: REUSSI.includes(statut),
    echoue: ECHOUE.includes(statut),
    montant: Number.isFinite(montant) ? montant : null,
    transaction: transaction ? String(transaction) : null,
  };
}

/**
 * Le corps d'une notification, devenu objet.
 *
 * Leur document le montre en JSON, mais l'annonce en
 * `application/x-www-form-urlencoded` : on lit l'un, et à défaut l'autre.
 * La signature, elle, se vérifie toujours sur le corps brut, avant.
 */
export function chargeDepuisCorps(corps: string): unknown {
  try {
    return JSON.parse(corps);
  } catch {
    const champs = Object.fromEntries(new URLSearchParams(corps));
    return Object.keys(champs).length ? champs : null;
  }
}

/**
 * La signature d'un corps de notification, telle que le prestataire la
 * calcule : le HMAC-SHA256 du corps brut avec la clé secrète (« KeySecret »),
 * en hexadécimal majuscule. Sert à la vérifier — et au simulateur local à
 * en fabriquer une. `null` sans clés.
 */
export function signerCorps(corps: string): string | null {
  const c = config();
  if (!c) return null;
  return createHmac("sha256", c.keySecret)
    .update(corps, "utf8")
    .digest("hex")
    .toUpperCase();
}

/**
 * Vérifie la signature d'une notification (`VPI-Signature`).
 *
 * Le corps doit être lu tel qu'il est arrivé : le relire après un
 * `JSON.parse` changerait un espace ou l'ordre des clés, et la signature ne
 * tomberait plus juste.
 *
 * La comparaison est à temps constant. Une comparaison ordinaire s'arrête au
 * premier caractère différent, et ce temps-là se mesure : on peut deviner une
 * signature valide octet par octet.
 */
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

/**
 * Les identifiants qu'un appelant présente sont-ils les nôtres ? Pour le
 * simulateur local, qui joue le prestataire et vérifie ce qu'on lui envoie.
 */
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

/**
 * Le simulateur local tient lieu de prestataire : `VANILLAPAY_BASE` pointe
 * alors vers nos propres routes `/api/bac-a-sable/vanillapay`. Jamais en
 * production — aucun argent n'y change de main.
 */
export function simulateurActif(): boolean {
  const base = process.env.VANILLAPAY_BASE?.trim().replace(/\/+$/, "") ?? "";
  return (
    process.env.NODE_ENV !== "production" &&
    /\/api\/bac-a-sable\/vanillapay$/.test(base) &&
    vanillaPayActif()
  );
}

/**
 * Interroge le prestataire quand sa notification ne nous est pas parvenue.
 * `id` est la référence de la transaction chez eux (« VPI… » ou « MM… »),
 * gardée à l'ouverture ; le mode est celui dans lequel elle a été ouverte.
 */
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
