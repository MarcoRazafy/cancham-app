import Image from "next/image";
import { CalendarDays, MapPin, Ticket } from "lucide-react";
import { Compte } from "@/components/public/traversee/Compte";
import { fmtMoney } from "@/lib/format";
import { EVENEMENT, type Decompte } from "@/lib/traversee";

const FONDS = ["accueil", "pitch", "reseau", "musique"] as const;

export const TEMPS = [
  {
    quand: "Toute la journée",
    titre: "Expositions",
    texte:
      "<b>Expositions des membres.</b> Vos prochains clients, fournisseurs et partenaires en un seul lieu.",
  },
  {
    quand: "En journée",
    titre: "Panels d’experts",
    texte:
      "<b>Panels d’experts.</b> Culture d’affaires, financement, investissement : les réponses de ceux qui connaissent le terrain.",
  },
  {
    quand: "17 h 00",
    titre: "Le 5 à 7",
    texte:
      "<b>Réseautage 5 à 7.</b> Deux heures d’échanges directs, un verre à la main.",
  },
  {
    quand: "19 h 00",
    titre: "Gala des 10 ans",
    texte:
      "<b>Le Gala des 10 ans.</b> Dîner, finale des pitchs et remise des lots.",
  },
] as const;

export function Hero({
  prixPass,
  decompte,
}: {
  prixPass: number;
  decompte: Decompte;
}) {
  return (
    <section className="plein hero nuit" id="hero">
      <div className="fond fonds" data-fonds>
        {FONDS.map((nom, i) => (
          <Image
            key={nom}
            src={`/traversee/${nom}.jpg`}
            alt=""
            fill
            sizes="100vw"
            priority={i === 0}
            className={i === 0 ? "actif" : undefined}
          />
        ))}
      </div>
      <i className="lueur-a" />
      <i className="lueur-b" />
      <div className="wrap">
        <p className="sur">Gala des 10 ans · {EVENEMENT.nom}</p>
        <h1>
          <span className="ligne">
            <span>Une journée pour</span>
          </span>
          <span className="ligne">
            <span>voir plus grand.</span>
          </span>
          <span className="ligne">
            <span>
              <em className="v">Une nuit pour </em>
              <em className="r">
                fêter <b className="dx">10</b> ans.
              </em>
            </span>
          </span>
        </h1>
        <p
          className="moment"
          data-moment
          aria-live="polite"
          dangerouslySetInnerHTML={{ __html: TEMPS[0].texte }}
        />
        <div className="reperes">
          <span>
            <CalendarDays aria-hidden="true" />
            {EVENEMENT.dateLisible}
          </span>
          <span>
            <MapPin aria-hidden="true" />
            {EVENEMENT.lieu}
          </span>
          <span>
            <Ticket aria-hidden="true" />
            Places limitées
          </span>
        </div>
        <div className="bas">
          <div className="actions">
            <a className="btn btn-rouge" href="#billet">
              Réserver mon billet · {fmtMoney(prixPass)} →
            </a>
            <Compte decompte={decompte} libelle="Temps restant avant le Gala" />
          </div>
          <div className="gagner">
            <span className="etiq">À gagner</span>
            <div className="lots">
              <div>
                <strong>Un mois au Canada, tout inclus</strong>
                <small>pour le lauréat du Pitch MECC 2027</small>
              </div>
              <div>
                <strong>{fmtMoney(EVENEMENT.lotTombola)} à la tombola</strong>
                <small>l’équivalent de 1 000 CAD</small>
              </div>
            </div>
            <a href="#defis">Voir les défis →</a>
          </div>
        </div>
        <div className="temps" data-onglets>
          {TEMPS.map((t, i) => (
            <button
              key={t.titre}
              type="button"
              className={`onglet${i === 0 ? " actif" : ""}`}
              data-t={t.texte}
            >
              <small>{t.quand}</small>
              <strong>{t.titre}</strong>
              <i />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
