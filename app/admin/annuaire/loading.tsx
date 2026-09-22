import {
  Bloc,
  Chargement,
  SqueletteCartes,
  SqueletteEnTete,
} from "@/components/Squelette";

export default function ChargementAnnuaire() {
  return (
    <Chargement>
      <SqueletteEnTete />
      <div className="flex gap-3 mb-5 flex-wrap">
        <Bloc className="h-10 w-[340px] max-w-full" />
        <Bloc className="h-10 w-[240px] max-w-full" />
      </div>
      <SqueletteCartes nombre={9} hauteurImage={110} />
    </Chargement>
  );
}
