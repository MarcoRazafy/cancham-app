import Image from "next/image";
import Link from "next/link";
import { COORDONNEES } from "@/lib/coordonnees";
import { fmtMoney } from "@/lib/format";
import { EVENEMENT, LIENS } from "@/lib/traversee";

export function Billet({
  billetterie,
  prixPass,
}: {
  billetterie: string;
  prixPass: number;
}) {
  return (
    <section className="plein brume" id="billet">
      <div className="wrap">
        <div className="entete" data-r>
          <div className="g">
            <p className="sur">Billetterie</p>
            <h2 className="h2">
              Un seul billet. <em className="r">Accès à tout.</em>
            </h2>
          </div>
          <p>La journée, le Gala, les deux défis et la plateforme.</p>
        </div>
        <div className="vente" data-s>
          <div className="pass" data-pass>
            <div className="tete">
              <div>
                <p className="nom">Billet {EVENEMENT.nom}</p>
                <p className="prix">
                  {prixPass.toLocaleString("fr-FR")}
                  <small>Ar</small>
                </p>
              </div>
              <p className="cote">
                Par personne
                <br />
                {EVENEMENT.dateLisible}
                <br />
                {EVENEMENT.lieuCourt}
              </p>
            </div>
            <div className="corps">
              <ul>
                <li>
                  <b>Expositions</b> des membres
                </li>
                <li>
                  <b>Six panels</b> d’experts
                </li>
                <li>
                  <b>Réseautage 5 à 7</b>
                </li>
                <li>
                  <b>Gala des 10 ans</b>
                </li>
                <li>
                  <b>Les deux défis</b> : MECC 2027 et{" "}
                  {fmtMoney(EVENEMENT.lotTombola)}
                </li>
                <li>
                  <b>La plateforme</b> des participants
                </li>
              </ul>
              <p className="paie">
                Paiement : MVola, Orange Money, Airtel Money, carte bancaire ou
                virement.
              </p>
              <Link className="btn btn-rouge" href={billetterie}>
                Réserver mon billet →
              </Link>
            </div>
          </div>
          <div className="cote-d">
            <div className="bloc-n photo">
              <Image
                src="/traversee/salle.jpg"
                alt=""
                fill
                sizes="(max-width: 980px) 50vw, 460px"
              />
              <b>Places limitées</b>
              <strong>La salle du Carlton fixe la limite.</strong>
              <span>Quand elle est pleine, la billetterie ferme.</span>
            </div>
            <div className="bloc-n">
              <strong>Vous venez en équipe ?</strong>
              <span>
                Écrivez-nous, nous vous guidons : tarif préférentiel et facture
                au nom de votre entreprise.
              </span>
              <a className="btn btn-trait" href={LIENS.equipe}>
                Nous envoyer un message →
              </a>
              <small className="joindre-e">
                {COORDONNEES.email} · {COORDONNEES.telephone}
              </small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
