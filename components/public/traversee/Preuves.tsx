import { retard } from "@/lib/traversee";

/**
 * Dix ans de résultats, en quatre chiffres sur le dégradé de la charte.
 *
 * Les nombres montent de zéro à leur valeur quand la bande entre à l'écran
 * (`data-compteur`, voir Mouvement.tsx). Chiffres repris de la page publique
 * d'origine ; à faire valider par la chambre avant publication.
 */
const CHIFFRES = [
  {
    valeur: 18,
    suffixe: " M$",
    libelle: "de chiffre d’affaires généré par nos missions économiques",
  },
  {
    valeur: 50,
    suffixe: "+",
    libelle: "entreprises accompagnées vers le marché canadien",
  },
  { valeur: 200, suffixe: "+", libelle: "membres au Canada et à Madagascar" },
  {
    valeur: 10,
    suffixe: " ans",
    libelle: "de missions, de formations et de mises en relation",
  },
];

export function Preuves() {
  return (
    <section className="preuves scene" aria-label="Dix ans de résultats">
      <div className="conteneur" style={{ paddingBlock: 44 }}>
        <div className="preuves-in">
          {CHIFFRES.map((c, i) => (
            <div
              key={c.libelle}
              className="reveler"
              style={retard(60 + i * 70)}
            >
              <b className="tnum">
                <span data-compteur={c.valeur}>0</span>
                {c.suffixe}
              </b>
              <span className="lbl">{c.libelle}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
