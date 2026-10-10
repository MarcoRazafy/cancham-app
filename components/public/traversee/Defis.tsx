import Image from "next/image";
import { fmtMoney } from "@/lib/format";
import { EVENEMENT } from "@/lib/traversee";

export const DOS = [
  {
    titre: "Pitch MECC 2027 · le lot comprend",
    points: [
      "Participation à la MECC 2027",
      "Billet d’avion aller-retour",
      "Hébergement",
      "Transport",
      "Restauration",
      "Un mois sur place",
    ],
  },
  {
    titre: "Tombola « J’y serai » · comment ça marche",
    points: [
      `${fmtMoney(EVENEMENT.lotTombola)}, soit 1 000 CAD`,
      "Votre photo au template CanCham 10 ans",
      "Taguez la CanCham",
      "Annoncez votre venue",
      "Gagnant tiré au sort",
    ],
  },
];

export function Defis() {
  return (
    <section className="plein defis" id="defis">
      <div className="wrap">
        <div className="entete" data-r>
          <div className="g">
            <p className="sur">Deux défis</p>
            <h2 className="h2">Venez pour le réseau. Repartez avec un lot.</h2>
          </div>
          <p>
            Deux lots se jouent entre les participants de la Traversée. Voici ce
            que vous pouvez gagner.
          </p>
        </div>
        <div className="deux rail large" data-s>
          <article className="lotc" tabIndex={0} role="button">
            <Image
              src="/traversee/oratrice.jpg"
              alt="Prise de parole au pupitre lors d’un événement CanCham"
              fill
              sizes="(max-width: 980px) 90vw, 560px"
            />
            <span className="tag">Défi 1 · Pitch MECC 2027</span>
            <div>
              <p className="gros">Un mois au Canada</p>
              <p className="ligne">
                Tous frais payés : vol, hébergement, transport et repas.
              </p>
            </div>
            <Dos index={0} />
          </article>
          <article className="lotc" tabIndex={0} role="button">
            <Image
              src="/traversee/equipe.jpg"
              alt="L’équipe CanCham à l’accueil d’une rencontre"
              fill
              sizes="(max-width: 980px) 90vw, 560px"
            />
            <span className="tag">Défi 2 · Tombola « J’y serai »</span>
            <div>
              <p className="gros" data-gros={EVENEMENT.lotTombola}>
                {fmtMoney(EVENEMENT.lotTombola)}
              </p>
              <p className="ligne">
                L’équivalent de 1 000 CAD, par tirage au sort.
              </p>
            </div>
            <Dos index={1} />
          </article>
        </div>
        <ol className="cadres" data-s>
          <li>Inscrivez-vous à la Traversée.</li>
          <li>Remplissez votre profil sur la plateforme.</li>
          <li>Suivez le guide pour être éligible.</li>
        </ol>
        <div className="actions">
          <a className="btn btn-rouge" href="#billet">
            Réserver pour participer →
          </a>
        </div>
      </div>
    </section>
  );
}

function Dos({ index }: { index: 0 | 1 }) {
  const d = DOS[index];
  return (
    <>
      <div className="dos">
        <h4>{d.titre}</h4>
        <ul>
          {d.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      <span className="indice">Cliquer ↻</span>
    </>
  );
}
