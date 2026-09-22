import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/session";

/**
 * Adresse racine : chacun chez soi. L'équipe au back-office, un membre dans
 * son espace, les autres à la connexion.
 */
export default async function Racine() {
  const u = await utilisateurConnecte();
  if (u?.role === "admin") redirect("/admin");
  if (u?.role === "membre") redirect("/membre");
  redirect("/auth");
}
