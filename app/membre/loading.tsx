import {
  Chargement,
  SqueletteCartes,
  SqueletteEnTete,
} from "@/components/Squelette";

export default function ChargementMembre() {
  return (
    <Chargement>
      <SqueletteEnTete />
      <SqueletteCartes nombre={6} />
    </Chargement>
  );
}
