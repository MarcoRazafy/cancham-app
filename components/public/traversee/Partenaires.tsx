import Image from "next/image";
import { LIENS, retard } from "@/lib/traversee";

/**
 * Partenaires et exposants. Les emplacements sont réservés : noms, sigles et
 * visuels d'attente, à remplacer par les logos et images des partenaires
 * signés. Deux offres en bas : exposer, ou associer sa marque aux 10 ans.
 */
const SPONSORS = [
  {
    niveau: "Sponsor officiel",
    sigle: "SO",
    sous: "Présente La Traversée · partenaire de la journée et du Gala",
    photo: "/traversee/salle.jpg",
    officiel: true,
    href: LIENS.rendezVous,
  },
  {
    niveau: "Sponsor Or",
    sigle: "OA",
    sous: "Partenaire du Pitch MECC",
    photo: "/traversee/ecran.jpg",
  },
  {
    niveau: "Sponsor Or",
    sigle: "OB",
    sous: "Partenaire du défi « J’y serai »",
    photo: "/traversee/oratrice.jpg",
  },
  {
    niveau: "Sponsor Argent",
    sigle: "AA",
    sous: "Partenaire voyage",
    photo: "/traversee/rdv.jpg",
  },
  {
    niveau: "Partenaire",
    sigle: "TR",
    sous: "Traiteur du Gala",
    photo: "/traversee/diner.jpg",
  },
  {
    niveau: "Partenaire",
    sigle: "ME",
    sous: "Partenaire média",
    photo: "/traversee/musique.jpg",
  },
];

export function Partenaires() {
  return (
    <section
      className="section sombre partenaires scene"
      id="partenaires"
      aria-labelledby="titre-partenaires"
    >
      <div className="conteneur">
        <div className="tete">
          <h2
            id="titre-partenaires"
            className="titre-section reveler"
            style={retard(80)}
          >
            Ils rendent <span className="saillant">la Traversée possible</span>
          </h2>
        </div>

        <div className="sponsors">
          {SPONSORS.map((s, i) => (
            <a
              key={s.sigle}
              className={`sponsor ${s.officiel ? "officiel" : ""} reveler-zoom`}
              style={retard(100 + i * 70)}
              href={s.href ?? "#partenaires"}
              target={s.href ? "_blank" : undefined}
              rel={s.href ? "noopener" : undefined}
            >
              <Image
                src={s.photo}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                style={{ objectFit: "cover" }}
              />
              <div className="sponsor-in">
                <span className="niveau">{s.niveau}</span>
                <span className="marque-vide">
                  <i aria-hidden="true">{s.sigle}</i>Votre marque
                </span>
                <span className="sous">{s.sous}</span>
              </div>
            </a>
          ))}
        </div>
        <p className="legende">
          Emplacements réservés : ils recevront les logos et visuels des
          partenaires signés.
        </p>

        <div className="offres">
          <div className="offre reveler" style={retard(120)}>
            <h3>Exposez pendant la journée</h3>
            <p>
              Un stand au cœur de l’événement, face aux acheteurs, investisseurs
              et partenaires présents.
            </p>
            <a
              className="btn-contour"
              href={LIENS.rendezVous}
              target="_blank"
              rel="noopener"
            >
              Réserver un stand
            </a>
          </div>
          <div className="offre reveler" style={retard(220)}>
            <h3>Associez votre marque aux 10 ans</h3>
            <p>
              Visibilité sur scène, dans l’application et pendant le direct,
              contacts qualifiés des participants.
            </p>
            <a
              className="btn-action"
              href={LIENS.rendezVous}
              target="_blank"
              rel="noopener"
            >
              Recevoir le dossier de partenariat{" "}
              <span className="fleche" aria-hidden="true">
                →
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
