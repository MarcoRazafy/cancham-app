import { revalidatePath } from "next/cache";
import { conclurePaiement } from "@/lib/paiements";
import { chargeDepuisCorps, lireEtat, signatureValide } from "@/lib/vanillapay";

export async function POST(req: Request) {
  const corps = await req.text();
  const signature =
    req.headers.get("VPI-Signature") ?? req.headers.get("vpi-signature");

  if (!signatureValide(corps, signature)) {
    console.error("[vanillapay] notification à signature invalide, rejetée");
    return new Response("signature invalide", { status: 401 });
  }

  const charge = chargeDepuisCorps(corps);
  if (!charge) return new Response("corps illisible", { status: 400 });

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
