import type { Instrumentation } from "next";

/**
 * Observabilité du serveur.
 *
 * Au démarrage, en production, on vérifie la configuration : une variable
 * oubliée se voit dans les journaux du déploiement, pas au premier membre
 * qui ne reçoit jamais son e-mail.
 *
 * Chaque erreur serveur — page, action, route — est écrite sur une ligne
 * JSON : Railway l'affiche telle quelle et on peut la filtrer. Sa référence
 * (`digest`) est celle que la page d'incident montre au membre.
 */

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const alertes: string[] = [];
  if (!process.env.AUTH_SECRET) {
    alertes.push("AUTH_SECRET manquant : aucune connexion ne fonctionnera.");
  }
  if (!process.env.STOCKAGE_RACINE) {
    alertes.push(
      "STOCKAGE_RACINE manquant : les fichiers envoyés seront perdus au prochain déploiement.",
    );
  }
  if (!process.env.RESEND_API_KEY) {
    alertes.push("RESEND_API_KEY manquant : aucun e-mail ne partira.");
  } else if (!process.env.COURRIEL_EXPEDITEUR) {
    alertes.push(
      "COURRIEL_EXPEDITEUR manquant : l'adresse de test de Resend n'écrit qu'au propriétaire du compte.",
    );
  }
  const appUrl = process.env.APP_URL?.trim();
  if (!appUrl) {
    alertes.push(
      "APP_URL manquant : les liens des e-mails utilisent https://app.cancham.mg.",
    );
  } else if (
    /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])/i.test(appUrl)
  ) {
    alertes.push(
      `APP_URL=${appUrl} pointe vers le serveur lui-même : ignorée, les liens des e-mails utilisent https://app.cancham.mg.`,
    );
  }
  if (process.env.CANCHAM_TODAY) {
    alertes.push(
      `CANCHAM_TODAY=${process.env.CANCHAM_TODAY} : la date du jour est figée. À retirer en production.`,
    );
  }
  for (const a of alertes) console.warn(`[configuration] ${a}`);
}

export const onRequestError: Instrumentation.onRequestError = (
  err,
  request,
  context,
) => {
  const e = err instanceof Error ? err : null;
  const digest =
    typeof err === "object" && err !== null && "digest" in err
      ? String(err.digest)
      : undefined;
  console.error(
    JSON.stringify({
      niveau: "erreur",
      date: new Date().toISOString(),
      methode: request.method,
      // Sans les paramètres : un lien de réinitialisation y porte son jeton.
      chemin: request.path.split("?")[0],
      route: context.routePath,
      type: context.routeType,
      digest,
      message: e?.message ?? String(err),
      pile: e?.stack
        ?.split("\n")
        .slice(1, 8)
        .map((l) => l.trim()),
    }),
  );
};
