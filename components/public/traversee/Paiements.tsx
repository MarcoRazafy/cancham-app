import Image from "next/image";

const MOYENS = [
  { nom: "MVola", src: "/traversee/paiement/mvola.jpg" },
  { nom: "Orange Money", src: "/traversee/paiement/orange-money.jpg" },
  { nom: "Airtel Money", src: "/traversee/paiement/airtel-money.jpg" },
  { nom: "Carte bancaire", src: "/traversee/paiement/carte-bancaire.jpg" },
  { nom: "Virement", src: "/traversee/paiement/virement.jpg" },
];

export function Paiements() {
  return (
    <div className="paiements" aria-label="Moyens de paiement acceptés">
      <span className="paiements-lbl">Paiement</span>
      <div className="paiements-fenetre">
        <div className="paiements-piste">
          {[0, 1].map((copie) => (
            <ul key={copie} aria-hidden={copie === 1 ? true : undefined}>
              {MOYENS.map((m) => (
                <li key={m.nom} title={m.nom}>
                  <Image
                    src={m.src}
                    alt={copie === 0 ? m.nom : ""}
                    width={480}
                    height={240}
                    sizes="120px"
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
