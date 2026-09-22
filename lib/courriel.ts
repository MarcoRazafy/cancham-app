import "server-only";

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
  try {
    const reponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cle}`,
        "Content-Type": "application/json",
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
      console.error(
        `[courriel] échec ${reponse.status} — à ${c.a} — « ${c.sujet} » : ${await reponse.text()}`,
      );
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[courriel] échec réseau — à ${c.a} — « ${c.sujet} »`, e);
    return false;
  }
}

/**
 * Adresse complète d'une page, pour les liens des e-mails.
 *
 * `APP_URL` quand elle est définie — c'est le cas en production. Sinon,
 * l'hôte de la requête en cours : suffisant en local.
 */
export async function urlPublique(chemin: string): Promise<string> {
  const base = process.env.APP_URL?.replace(/\/$/, "");
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
 * Il est servi par la plateforme, à son adresse publique : les messageries
 * refusent les images glissées dans le message lui-même (Gmail ignore les
 * `data:`). Sans `APP_URL` — en local, où aucune messagerie ne joindrait
 * l'image —, le nom de la plateforme en toutes lettres.
 */
function enTete(): string {
  const base = process.env.APP_URL?.replace(/\/$/, "");
  if (!base) return "CanCham Connect";
  return `<img src="${echapper(`${base}/marque/logo-courriel.png`)}" width="220" height="66" alt="CanCham — Chambre de Commerce et de Coopération Canada-Madagascar" style="display:block;border:0;outline:none;text-decoration:none;width:220px;height:auto;color:#ffffff;font-size:16px;font-weight:bold">`;
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
