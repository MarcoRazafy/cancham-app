import Image from "next/image";
import { EVENEMENT, retard } from "@/lib/traversee";

const ETAPES = [
  {
    heure: "Toute la journée",
    titre: "Expositions",
    texte:
      "Les entreprises exposantes présentent leurs produits et services. Découvrez, comparez, repérez vos futurs partenaires.",
    photo: "/traversee/accueil.jpg",
    alt: "Participants à l’accueil d’un événement CanCham",
    legende: "Accueil et stands",
  },
  {
    heure: "Matinée · horaire à confirmer",
    titre: "Doing Business in Canada",
    texte:
      "La formation pour comprendre le marché canadien : normes, circuits de distribution, négociation et culture d’affaires.",
    photo: "/traversee/ecran.jpg",
    alt: "Présentation devant écran lors d’une rencontre CanCham",
    legende: "Formation",
  },
  {
    heure: "17 h 00",
    titre: "5 à 7 d’affaires",
    texte:
      "Le moment des échanges directs. Vos rendez-vous pris dans l’application, et toutes les rencontres que vous n’aviez pas prévues.",
    photo: "/traversee/reseau.jpg",
    alt: "Deux participantes échangent lors d’un événement CanCham",
    legende: "Réseautage",
  },
];

const GALA = [
  "Cocktail",
  "Dîner",
  "Pitch MECC en direct",
  "Remise des prix",
  "Spectacle",
  "Livre d’or",
];

export function Programme() {
  return (
    <section
      className="section clair scene"
      id="programme"
      aria-labelledby="titre-programme"
    >
      <div className="conteneur">
        <div className="tete ligne">
          <div>
            <h2
              id="titre-programme"
              className="titre-section reveler"
              style={retard(80)}
            >
              Un pass. <span className="saillant rouge">Toute la journée.</span>
            </h2>
          </div>
          <p className="chapeau reveler" style={retard(160)}>
            Quatre temps qui montent en puissance, du matin jusqu’au Gala des 10
            ans, l’événement phare de la Traversée. Vous venez aux moments qui
            vous intéressent, votre pass ouvre chacun d’eux.
          </p>
        </div>

        <ol className="parcours">
          {ETAPES.map((e, i) => (
            <li
              key={e.titre}
              className="etape reveler"
              style={retard(200 + i * 120)}
            >
              <figure>
                <Image
                  src={e.photo}
                  alt={e.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 25vw"
                  style={{ objectFit: "cover" }}
                />
                <figcaption>{e.legende}</figcaption>
              </figure>
              <div className="etape-corps">
                <time>{e.heure}</time>
                <h3>{e.titre}</h3>
                <p>{e.texte}</p>
              </div>
            </li>
          ))}
          <li className="etape phare reveler" style={retard(560)}>
            <figure>
              <Image
                src="/traversee/musique.jpg"
                alt="Musiciens et chanteuse lors d’une soirée CanCham"
                fill
                sizes="(max-width: 1024px) 100vw, 25vw"
                style={{ objectFit: "cover" }}
              />
              <span className="mention">Événement phare</span>
            </figure>
            <div className="etape-corps">
              <time>19 h 00</time>
              <h3>Le Gala des 10 ans</h3>
              <p>
                Dîner de gala, finale du Pitch MECC en direct, annonce du
                gagnant des 5 000 000 Ar et moments artistiques en présence de
                nos ambassadeurs {EVENEMENT.ambassadeurs}.
              </p>
              <ul aria-label="Au programme du gala">
                {GALA.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
