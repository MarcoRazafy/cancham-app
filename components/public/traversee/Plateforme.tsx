import Image from "next/image";
import { fmtMoney } from "@/lib/format";
import { EVENEMENT, type Decompte } from "@/lib/traversee";

const ATOUTS = [
  {
    no: "01",
    titre: "Réseautage",
    texte: "Profils des participants, contacts, rendez-vous fixés.",
  },
  {
    no: "02",
    titre: "Les deux défis",
    texte: "Votre profil, puis le guide pour participer.",
  },
  {
    no: "03",
    titre: "Infos en primeur",
    texte: "Programme, panels, exposants et annonces.",
  },
  { no: "04", titre: "Votre billet", texte: "Toujours avec vous le jour J." },
];

const MINIS = [
  {
    photo: "oratrice",
    titre: "Pitch MECC 2027",
    lot: "1 mois au Canada",
    action: "Déposer mon pitch",
  },
  {
    photo: "equipe",
    titre: "Tombola « J’y serai »",
    lot: fmtMoney(EVENEMENT.lotTombola),
    action: "Participer",
  },
  {
    photo: "reseau",
    titre: "Réseau",
    lot: "Qui sera là ?",
    action: "Voir les profils",
  },
];

export function Plateforme({ decompte }: { decompte: Decompte }) {
  return (
    <section className="plein plateforme nuit" id="plateforme">
      <div className="wrap">
        <div className="tel" aria-hidden="true">
          <div className="ecran">
            <div className="statut">
              <span>9:41</span>
              <i className="ile" />
              <span className="ic">
                <i className="res" />
                <i className="bat" />
              </span>
            </div>
            <div className="bandeau-tel">
              Gala dans <span data-cd-mini>{decompte.j} j</span>
            </div>
            <div className="dedans" data-dedans>
              <h3>Relevez les défis, gagnez les lots</h3>
              {MINIS.map((m) => (
                <div className="mini" key={m.titre}>
                  <div className="v">
                    <Image
                      src={`/traversee/${m.photo}.jpg`}
                      alt=""
                      fill
                      sizes="66px"
                    />
                  </div>
                  <div>
                    <strong>{m.titre}</strong>
                    <b>{m.lot}</b>
                    <span>{m.action}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="onglets">
              <b>Accueil</b>
              <span>Défis</span>
              <span>Réseau</span>
              <span>Infos</span>
              <span>Billet</span>
            </div>
            <div className="maison" />
          </div>
        </div>
        <div data-r>
          <p className="sur">Votre plateforme dédiée</p>
          <h2 className="h2">
            L’événement commence <em className="v">dès votre réservation.</em>
          </h2>
          <p className="intro">
            Votre billet ouvre la plateforme réservée aux participants. Vous
            arrivez au Carlton déjà prêt.
          </p>
          <div className="atouts">
            {ATOUTS.map((a) => (
              <div key={a.no}>
                <i>{a.no}</i>
                <strong>{a.titre}</strong>
                <span>{a.texte}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
