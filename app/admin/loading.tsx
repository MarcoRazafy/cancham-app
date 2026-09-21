import {
  Chargement,
  SqueletteCompteurs,
  SqueletteEnTete,
  SquelettePanneau,
} from "@/components/Squelette";

/** Back-office : chiffres en tête, encadrés dessous. */
export default function ChargementAdmin() {
  return (
    <Chargement>
      <SqueletteEnTete />
      <SqueletteCompteurs />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <SquelettePanneau lignes={5} />
        <SquelettePanneau lignes={3} />
      </div>
    </Chargement>
  );
}
