import "server-only";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { COORDONNEES } from "@/lib/coordonnees";

/**
 * Envoi des e-mails, par Resend.
 *
 * Un simple appel HTTP à leur API : pas de bibliothèque de plus. Sans clé
 * (`RESEND_API_KEY`), en local surtout, rien ne part : le message est écrit
 * dans les journaux du serveur, lien compris, pour qu'on puisse suivre le
 * parcours sans boîte de réception.
 *
 * Un envoi qui échoue ne fait jamais échouer l'action qui l'a demandé : on
 * n'empêche pas une inscription parce que le service d'e-mails hoquette.
 * L'échec est écrit dans les journaux, et l'appelant sait que rien n'est
 * parti.
 */

export interface Courriel {
  a: string;
  sujet: string;
  html: string;
  texte: string;
}

/** Adresse d'expédition, sur un domaine vérifié chez Resend. */
const EXPEDITEUR =
  process.env.COURRIEL_EXPEDITEUR || "CanCham Connect <onboarding@resend.dev>";

/** Où arrivent les alertes destinées à l'équipe. */
export const COURRIEL_EQUIPE = process.env.COURRIEL_EQUIPE || COORDONNEES.email;

/** Faux tant que la clé Resend n'est pas posée : rien ne part vraiment. */
export function courrielsActifs(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function envoyerCourriel(c: Courriel): Promise<boolean> {
  const cle = process.env.RESEND_API_KEY;
  if (!cle) {
    console.info(
      `[courriel] non envoyé (RESEND_API_KEY absente) — à ${c.a} — « ${c.sujet} »\n${c.texte}`,
    );
    return false;
  }
  // Une coupure réseau passagère ne doit pas coûter un e-mail : on
  // réessaie une fois. La clé d'idempotence garantit qu'un premier envoi
  // arrivé malgré tout chez Resend ne part pas en double.
  const idempotence = randomUUID();
  for (let essai = 1; essai <= ESSAIS_ENVOI; essai++) {
    try {
      const reponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cle}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotence,
        },
        body: JSON.stringify({
          from: EXPEDITEUR,
          to: [c.a],
          subject: c.sujet,
          html: c.html,
          text: c.texte,
          // Une réponse à un e-mail automatique arrive à l'équipe.
          reply_to: COURRIEL_EQUIPE,
        }),
      });
      if (!reponse.ok) {
        // Refus du service (adresse, domaine, clé) : réessayer n'y changerait rien.
        console.error(
          `[courriel] échec ${reponse.status} — à ${c.a} — « ${c.sujet} » : ${await reponse.text()}`,
        );
        return false;
      }
      return true;
    } catch (e) {
      if (essai < ESSAIS_ENVOI) {
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }
      console.error(`[courriel] échec réseau — à ${c.a} — « ${c.sujet} »`, e);
    }
  }
  return false;
}

/** Tentatives par e-mail : la première, et une reprise après coupure réseau. */
const ESSAIS_ENVOI = 2;

/** L'adresse de la plateforme en ligne : celle des liens envoyés aux membres. */
export const ADRESSE_PLATEFORME = "https://app.cancham.mg";

/** Une adresse qui ne mène qu'à la machine où tourne le serveur. */
export function estAdresseLocale(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?(\/|$)/i.test(
    url,
  );
}

/**
 * Base des liens des e-mails : `APP_URL`, sans barre finale.
 *
 * En production, une adresse locale n'est jamais crue — un `.env` recopié
 * tel quel enverrait aux membres des liens vers « localhost », qu'ils ne
 * peuvent pas ouvrir. On prend alors l'adresse de la plateforme, comme quand
 * la variable manque. En local, `APP_URL` peut viser localhost : les liens
 * de test mènent à la base locale, où vivent leurs jetons.
 */
function baseLiens(): string | null {
  const base = process.env.APP_URL?.trim().replace(/\/+$/, "") || null;
  if (process.env.NODE_ENV !== "production") return base;
  return base && !estAdresseLocale(base) ? base : ADRESSE_PLATEFORME;
}

/**
 * Adresse complète d'une page, pour les liens des e-mails.
 *
 * La base des liens (voir `baseLiens`) ; en local sans `APP_URL`, l'hôte de
 * la requête en cours.
 */
export async function urlPublique(chemin: string): Promise<string> {
  const base = baseLiens();
  if (base) return `${base}${chemin}`;
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocole =
    h.get("x-forwarded-proto") ??
    (hote.startsWith("localhost") ? "http" : "https");
  return `${protocole}://${hote}${chemin}`;
}

/* ============================ Gabarit ============================ */

/**
 * Le logo de la chambre, en tête de chaque e-mail.
 *
 * Il est servi par la plateforme en ligne : les messageries refusent les
 * images glissées dans le message lui-même (Gmail ignore les `data:`), et
 * aucune ne joindrait une image sur localhost. Un e-mail parti d'un poste de
 * développement prend donc lui aussi le logo sur app.cancham.mg.
 */
function enTete(): string {
  const base = baseLiens();
  const site = base && !estAdresseLocale(base) ? base : ADRESSE_PLATEFORME;
  return `<img src="${echapper(`${site}/marque/logo-courriel.png`)}" width="220" height="66" alt="CanCham — Chambre de Commerce et de Coopération Canada-Madagascar" style="display:block;border:0;outline:none;text-decoration:none;width:220px;height:auto;color:#ffffff;font-size:16px;font-weight:bold">`;
}

/** Une valeur venue d'un formulaire ne doit pas devenir du HTML. */
export function echapper(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Mise en page commune : bandeau aux couleurs de la chambre, paragraphes,
 * un bouton, et une version texte pour les messageries qui n'affichent pas
 * le HTML. Les paragraphes sont du texte : ils sont échappés ici.
 */
export function gabarit({
  titre,
  paragraphes,
  bouton,
  apres = [],
}: {
  titre: string;
  paragraphes: string[];
  bouton?: { libelle: string; url: string };
  /** Paragraphes sous le bouton, en plus petit. */
  apres?: string[];
}): { html: string; texte: string } {
  const p = (t: string, taille = 15, couleur = "#3d4b5c") =>
    `<p style="margin:0 0 14px;font-size:${taille}px;line-height:1.6;color:${couleur}">${echapper(t)}</p>`;

  const html = `<!doctype html>
<html lang="fr"><body style="margin:0;padding:24px 12px;background:#f3f5f8;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#0f1d2c;padding:18px 28px;color:#ffffff;font-size:18px;font-weight:bold">${enTete()}</td></tr>
<tr><td style="height:4px;background:linear-gradient(90deg,#ad0707,#007140)"></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 18px;font-size:21px;color:#0f1d2c">${echapper(titre)}</h1>
${paragraphes.map((t) => p(t)).join("\n")}
${
  bouton
    ? `<p style="margin:22px 0"><a href="${echapper(bouton.url)}" style="display:inline-block;background:#ad0707;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px">${echapper(bouton.libelle)}</a></p>`
    : ""
}
${apres.map((t) => p(t, 13, "#6b7a8a")).join("\n")}
</td></tr>
<tr><td style="padding:16px 28px;background:#f7f9fb;font-size:12px;color:#8a97a6">Chambre de Commerce et de Coopération Canada–Madagascar · ${echapper(COORDONNEES.email)} · ${echapper(COORDONNEES.telephone)}</td></tr>
</table></td></tr></table></body></html>`;

  const texte = [
    titre,
    "",
    ...paragraphes.flatMap((t) => [t, ""]),
    ...(bouton ? [`${bouton.libelle} : ${bouton.url}`, ""] : []),
    ...apres.flatMap((t) => [t, ""]),
    "—",
    `CanCham · ${COORDONNEES.email} · ${COORDONNEES.telephone}`,
  ].join("\n");

  return { html, texte };
}
