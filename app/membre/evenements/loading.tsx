import {
  Chargement,
  SqueletteCartes,
  SqueletteEnTete,
} from "@/components/Squelette";

export default function ChargementEvenements() {
  return (
    <Chargement>
      <SqueletteEnTete />
      <SqueletteCartes nombre={6} hauteurImage={170} />
    </Chargement>
  );
}
