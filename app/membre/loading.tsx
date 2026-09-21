import {
  Chargement,
  SqueletteCartes,
  SqueletteEnTete,
} from "@/components/Squelette";

/** Espace membre : la silhouette d'une page, pendant qu'elle se prépare. */
export default function ChargementMembre() {
  return (
    <Chargement>
      <SqueletteEnTete />
      <SqueletteCartes nombre={6} />
    </Chargement>
  );
}
