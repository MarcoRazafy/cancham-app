import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { Paiements } from "@/components/public/traversee/Paiements";
import { fmtMoney } from "@/lib/format";
import { EVENEMENT, retard } from "@/lib/traversee";

/**
 * Le pass, dessiné comme un vrai billet : talon rouge, ligne perforée, puis
 * ce qu'il comprend et les logos des moyens de paiement en carrousel. À côté, deux encarts : la
 * jauge de la salle, et la réservation d'équipe.
 *
 * `billetterie` : où réserver — la fiche de l'événement sur la plateforme.
 * `prixPass` : le tarif public de cette fiche.
 */
const INCLUS = [
  <>
    <b>Expositions</b> toute la journée
  </>,
  <>
    <b>Doing Business in Canada</b>, la formation
  </>,
  <>
    <b>5 à 7 d’affaires</b> et rendez-vous B2B
  </>,
  <>
    <b>Gala des 10 ans</b> : cocktail, dîner, spectacle, prix
  </>,
  <>
    <b>Les trois défis</b> : 10 000 000 Ar et une MECC
  </>,
  <>
    <b>L’application</b> : pass QR, réseautage, direct
  </>,
];

export function Billet({
  billetterie,
  prixPass,
}: {
  billetterie: string;
  prixPass: number;
}) {
  return (
    <section
      className="section clair papier scene"
      id="billet"
      aria-labelledby="titre-billet"
    >
      <div className="conteneur">
        <div className="tete ligne">
          <div>
            <h2
              id="titre-billet"
              className="titre-section reveler"
              style={retard(80)}
            >
              Un seul pass.{" "}
              <span className="saillant rouge">Accès à tout.</span>
            </h2>
          </div>
          <p className="chapeau reveler" style={retard(160)}>
            Expositions, formation, 5 à 7 et Gala : votre pass nominatif ouvre
            chaque temps de la Traversée, et l’application dès aujourd’hui.
          </p>
        </div>

        <div className="billet-grille">
          <article className="pass reveler" style={retard(120)}>
            <div className="pass-haut">
              <div>
                <span className="surtitre">Pass La Traversée</span>
                <div className="pass-prix tnum">
                  {prixPass
                    .toLocaleString("fr-FR")
                    .replace(/[\u202f\u00a0]/g, " ")}
                  <small>Ar</small>
                </div>
              </div>
              <p className="quand">
                Par personne
                <br />
                {EVENEMENT.dateLisible}
                <br />
                {EVENEMENT.lieuCourt} · toute la journée
              </p>
            </div>
            <div className="perfo" aria-hidden="true" />
            <div className="pass-corps">
              <ul className="inclus">
                {INCLUS.map((contenu, i) => (
                  <li key={i}>
                    <Check size={18} strokeWidth={2.6} aria-hidden="true" />
                    <span>{contenu}</span>
                  </li>
                ))}
              </ul>
              <Paiements />
              <Link className="btn-action" href={billetterie}>
                Réserver ma journée{" "}
                <span className="fleche" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </article>

          <div className="encarts">
            <div className="encart photo reveler" style={retard(220)}>
              <Image
                src="/traversee/salle.jpg"
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                style={{ objectFit: "cover" }}
              />
              <span className="pulse">
                <i aria-hidden="true" />
                Places limitées
              </span>
              <h3>La capacité de la salle fixe la limite</h3>
              <p>
                Une fois la jauge atteinte, la billetterie ferme. Réservez tant
                qu’il reste des places.
              </p>
            </div>
            <div className="encart reveler" style={retard(320)}>
              <h3>Vous venez en équipe ?</h3>
              <p>
                Réservez plusieurs pass en une fois. Chaque collaborateur reçoit
                son billet nominatif et son accès à l’application. Facture au
                nom de l’entreprise.
              </p>
              <Link className="btn-contour" href={billetterie}>
                Réserver pour mon équipe
              </Link>
            </div>
          </div>
        </div>
        <p className="sr-only">Pass à {fmtMoney(prixPass)} par personne.</p>
      </div>
    </section>
  );
}
