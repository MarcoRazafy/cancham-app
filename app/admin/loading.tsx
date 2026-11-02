import {
  Chargement,
  SqueletteCompteurs,
  SqueletteEnTete,
  SquelettePanneau,
} from "@/components/Squelette";

export default function ChargementAdmin() {
  return (
    <Chargement>
      <SqueletteEnTete />
      <SqueletteCompteurs />
      <div className="grid gap-4 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_360px]">
        <SquelettePanneau lignes={5} />
        <SquelettePanneau lignes={3} />
      </div>
    </Chargement>
  );
}
