import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, Ticket } from "lucide-react";
import { DiaporamaHero } from "@/components/public/traversee/DiaporamaHero";
import { Lots } from "@/components/public/traversee/Lots";
import { CompteARebours } from "@/components/public/traversee/Mouvement";
import { LienAncre } from "@/components/public/LienAncre";
import { fmtMoney } from "@/lib/format";
import { EVENEMENT, retard } from "@/lib/traversee";

export function Hero({
  billetterie,
  prixPass,
}: {
  billetterie: string;
  prixPass: number;
}) {
  return (
    <section className="hero sombre" aria-labelledby="titre-hero">
      <DiaporamaHero />
      <div className="hero-grille" aria-hidden="true" />

      <div className="conteneur hero-in">
        <div>
          <span
            className="surtitre apparition"
            style={{ ...retard(80), color: "#fff" }}
          >
            Gala des 10 ans · {EVENEMENT.nom}
          </span>
          <h1 id="titre-hero">
            <span className="l apparition" style={retard(180)}>
              Une journée pour
            </span>
            <span className="l apparition" style={retard(300)}>
              ouvrir le Canada.
            </span>
            <span className="l saillant vert apparition" style={retard(460)}>
              Une nuit pour
            </span>
            <span className="l saillant rouge apparition" style={retard(560)}>
              fêter dix ans.
            </span>
          </h1>
          <p className="chapeau apparition" style={retard(600)}>
            Expositions, formation <b>Doing Business in Canada</b>, 5 à 7
            d&apos;affaires, puis le grand Gala des 10 ans de la Chambre de
            Commerce et de Coopération Canada-Madagascar. Du matin jusqu&apos;au
            bout de la nuit, les décideurs des deux pays dans une même salle.
          </p>

          <div className="hero-infos apparition" style={retard(720)}>
            <span>
              <CalendarDays size={18} aria-hidden="true" />
              {EVENEMENT.dateLisible}
            </span>
            <span>
              <MapPin size={18} aria-hidden="true" />
              {EVENEMENT.lieu}
            </span>
            <span className="places">
              <Ticket size={18} aria-hidden="true" />
              Places limitées
            </span>
          </div>

          <div className="hero-cta apparition" style={retard(840)}>
            <Link className="btn-action" href={billetterie}>
              Réserver mon pass · {fmtMoney(prixPass)}
              <span className="fleche" aria-hidden="true">
                →
              </span>
            </Link>
            <LienAncre className="btn-contour" href="#programme">
              Voir le programme
            </LienAncre>
          </div>

          <div className="apparition" style={retard(980)}>
            <Lots />
          </div>
        </div>

        <div className="hero-droite">
          <Image
            className="badge-10 apparition"
            style={retard(500)}
            src="/marque/10-ans.png"
            alt="10 ans"
            width={1100}
            height={386}
            priority
          />
          <div className="apparition" style={retard(760)}>
            <CompteARebours />
            <p className="compte-legende" style={{ marginTop: 10 }}>
              Ouverture des portes le 18 décembre à 19 h 00
            </p>
          </div>
        </div>
      </div>

      <div
        className="pont apparition"
        style={{
          ...retard(1100),
          animationName: "traversee-reveler-trait",
          animationDuration: "1.2s",
        }}
        aria-hidden="true"
      />
    </section>
  );
}
