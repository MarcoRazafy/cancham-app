import { redirect } from "next/navigation";

/**
 * L'ancienne page de publication. On publie désormais depuis le fil, par
 * la barre de publication en tête de page : les liens gardés vers cette
 * adresse y ramènent.
 */
export default function NouvelleActualiteMembre() {
  redirect("/membre/actualites");
}
