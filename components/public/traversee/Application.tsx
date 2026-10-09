import Image from "next/image";
import { Telephone } from "@/components/public/traversee/Telephone";
import { fmtMoney } from "@/lib/format";
import { EVENEMENT, retard } from "@/lib/traversee";

const FONCTIONS = [
  {
    titre: "Rendez-vous B2B",
    texte:
      "Annuaire des participants, messagerie et rendez-vous fixés à l’avance.",
  },
  {
    titre: "Les trois défis",
    texte:
      "Participez, suivez le classement, votez pour les pitchs le soir du gala.",
  },
  {
    titre: "Pass QR",
    texte: "Une entrée en quelques secondes, à chaque temps de la journée.",
  },
  {
    titre: "Programme et exposants",
    texte: "Horaires, plan de salle et votre table au gala.",
  },
  {
    titre: "MECC 2027",
    texte:
      "Positionnez votre entreprise sur les deux prochaines missions au Canada.",
  },
  {
    titre: "Direct et photos",
    texte: "Revivez la journée et retrouvez-vous sur les photos officielles.",
  },
];

const CARTES = [
  {
    photo: "/traversee/oratrice.jpg",
    titre: "« J’y serai »",
    lot: fmtMoney(EVENEMENT.prixDefi),
    action: "Participer",
  },
  {
    photo: "/traversee/pitch.jpg",
    titre: "Pitch MECC",
    lot: "MECC offerte",
    action: "Déposer mon pitch",
  },
  {
    photo: "/traversee/diner.jpg",
    titre: "« J’y étais »",
    lot: fmtMoney(EVENEMENT.prixDefi),
    action: "Voir le règlement",
  },
];

export function Application() {
  return (
    <section
      className="section sombre appli scene"
      id="application"
      aria-labelledby="titre-appli"
    >
      <div className="conteneur">
        <div className="reveler-zoom">
          <Telephone>
            <div className="ecran">
              <div className="e-haut">
                <Image
                  src="/marque/logo-blanc.png"
                  alt=""
                  width={2383}
                  height={711}
                  style={{ width: 110, height: "auto" }}
                />
              </div>
              <div className="e-cd">
                GALA DANS{" "}
                <b className="tnum">
                  <span data-cd="j">0</span> j <span data-cd="h">00</span> h{" "}
                  <span data-cd="m">00</span> min
                </b>
              </div>
              <div className="e-corps">
                <h4>Relevez les défis, gagnez les lots</h4>
                {CARTES.map((c) => (
                  <div key={c.titre} className="e-carte">
                    <span className="e-img">
                      <Image
                        src={c.photo}
                        alt=""
                        fill
                        sizes="84px"
                        style={{ objectFit: "cover" }}
                      />
                    </span>
                    <div>
                      <b>{c.titre}</b>
                      <strong>{c.lot}</strong>
                      <span className="go">{c.action}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="e-onglets">
                <span>Accueil</span>
                <span>Défis</span>
                <span>Communauté</span>
                <span>Réseau</span>
                <span>Billet</span>
              </div>
            </div>
          </Telephone>
        </div>

        <div>
          <div className="tete">
            <h2
              id="titre-appli"
              className="titre-section reveler"
              style={retard(80)}
            >
              L’événement commence{" "}
              <span className="saillant">dès votre réservation</span>
            </h2>
            <p className="chapeau reveler" style={retard(160)}>
              Votre pass ouvre l’application de la Traversée. Vous préparez vos
              rencontres, vous jouez pour les lots, vous arrivez prêt.
            </p>
          </div>
          <div className="fonctions">
            {FONCTIONS.map((f, i) => (
              <div
                key={f.titre}
                className="fonction reveler-gauche"
                style={retard(200 + i * 70)}
              >
                <span className="fonction-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <b>{f.titre}</b>
                  <span>{f.texte}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
