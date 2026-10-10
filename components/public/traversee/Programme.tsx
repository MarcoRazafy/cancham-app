import Image from "next/image";

const CARTES = [
  {
    photo: "accueil",
    alt: "Participants à l’accueil d’un événement CanCham",
    etiquette: "Stands",
    heure: "Toute la journée",
    titre: "Expositions des membres",
    texte:
      "Vos prochains clients, fournisseurs et partenaires en un seul lieu.",
  },
  {
    photo: "pitch",
    alt: "Intervenante au micro lors d’une rencontre CanCham",
    etiquette: "Expertise",
    heure: "En journée",
    titre: "Panels d’experts",
    texte:
      "Culture d’affaires, financement, investissement : les réponses de ceux qui connaissent le terrain.",
  },
  {
    photo: "reseau",
    alt: "Deux participantes échangent lors d’un événement CanCham",
    etiquette: "Réseautage",
    heure: "17 h 00",
    titre: "Le 5 à 7",
    texte: "Deux heures d’échanges directs, un verre à la main.",
  },
];

const PANELS = [
  "Culture d’affaires canadienne",
  "Investissement",
  "Commerce",
  "Accès au financement",
  "Entreprendre et immigrer au Canada",
  "Réseautage",
];

export function Programme() {
  return (
    <section className="plein" id="programme">
      <div className="wrap">
        <div className="entete" data-r>
          <div className="g">
            <p className="sur">Au programme</p>
            <h2 className="h2">
              Un billet. <em className="r">Toute la journée.</em>
            </h2>
          </div>
          <p>
            Quatre temps forts, du matin jusqu’au Gala. Votre billet les ouvre
            tous.
          </p>
        </div>
        <div className="frise-h" data-vu>
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="cartes rail" data-s>
          {CARTES.map((c) => (
            <article className="carte" key={c.titre}>
              <div className="vue">
                <Image
                  src={`/traversee/${c.photo}.jpg`}
                  alt={c.alt}
                  fill
                  sizes="(max-width: 980px) 80vw, 280px"
                />
                <span>{c.etiquette}</span>
              </div>
              <div className="txt">
                <span className="heure">{c.heure}</span>
                <h3>{c.titre}</h3>
                <p>{c.texte}</p>
              </div>
            </article>
          ))}
          <article className="carte phare">
            <div className="vue">
              <Image
                src="/traversee/musique.jpg"
                alt="Musiciens et chanteuse lors d’une soirée CanCham"
                fill
                sizes="(max-width: 980px) 80vw, 280px"
              />
              <span>Événement phare</span>
            </div>
            <div className="txt">
              <span className="heure">19 h 00</span>
              <h3>Le Gala des 10 ans</h3>
              <ul className="chips">
                <li>Dîner</li>
                <li>Finale des pitchs</li>
                <li>Remise des lots</li>
              </ul>
            </div>
          </article>
        </div>
        <div className="panels nuit" data-r>
          <h3>Les six panels</h3>
          <ul className="chips">
            {PANELS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
