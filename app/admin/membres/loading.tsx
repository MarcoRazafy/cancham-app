import {
  Bloc,
  Chargement,
  SqueletteEnTete,
  SqueletteListe,
} from "@/components/Squelette";

/** Une liste du back-office : filtres, puis les lignes. */
export default function ChargementListe() {
  return (
    <Chargement>
      <SqueletteEnTete />
      <div className="flex gap-3 mb-4 flex-wrap">
        <Bloc className="h-10 w-[380px] max-w-full" />
        <Bloc className="h-10 w-[180px] max-w-full" />
      </div>
      <SqueletteListe lignes={8} />
    </Chargement>
  );
}
