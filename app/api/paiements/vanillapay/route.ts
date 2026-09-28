import { revalidatePath } from "next/cache";
import { conclurePaiement } from "@/lib/paiements";
import { lireEtat, signatureValide } from "@/lib/vanillapay";

/**
 * Notification de Vanilla Pay : c'est elle, et elle seule, qui règle une
 * facture.
 *
 * Le retour du navigateur ne prouve rien — un membre peut fabriquer cette
 * adresse. Ici, la requête est signée : on recalcule le HMAC du corps brut
 * avec la clé secrète et on refuse tout ce qui ne correspond pas.
 *
 * Une fois la signature vérifiée, on répond 200 même quand il n'y a rien à
 * faire — référence inconnue, paiement déjà encaissé. Répondre en erreur les
 * ferait réessayer indéfiniment pour un cas qui ne se réglera jamais.
 */
export async function POST(req: Request) {
  // Le corps est lu tel qu'il est arrivé : le relire après un `JSON.parse`
  // changerait un espace ou l'ordre des clés, et la signature tomberait faux.
  const corps = await req.text();
  const signature =
    req.headers.get("VPI-Signature") ?? req.headers.get("vpi-signature");

  if (!signatureValide(corps, signature)) {
    console.error("[vanillapay] notification à signature invalide, rejetée");
    return new Response("signature invalide", { status: 401 });
  }

  let charge: unknown;
  try {
    charge = JSON.parse(corps);
  } catch {
    return new Response("corps illisible", { status: 400 });
  }

  const etat = lireEtat(charge);
  if (!etat) {
    console.error(
      `[vanillapay] notification illisible : ${corps.slice(0, 500)}`,
    );
    return new Response("état illisible", { status: 400 });
  }

  const issue = await conclurePaiement(etat, charge);
  if (issue === "reglee") revalidatePath("/", "layout");

  return Response.json(
    { recu: true, issue },
    { headers: { "Cache-Control": "no-store" } },
  );
}
