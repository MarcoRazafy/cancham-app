import {
  Chargement,
  SqueletteEnTete,
  SqueletteMessagerie,
} from "@/components/Squelette";

export default function ChargementMessagerie() {
  return (
    <Chargement>
      <SqueletteEnTete />
      <SqueletteMessagerie />
    </Chargement>
  );
}
