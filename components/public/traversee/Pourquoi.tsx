import Image from "next/image";
import { BookOpen, Building2, MessageSquare, Send } from "lucide-react";
import { retard } from "@/lib/traversee";

/**
 * Six raisons de venir, en grille bento : deux grandes cartes photo et
 * quatre tuiles texte. Les cartes grandissent légèrement en entrant
 * (`reveler-zoom`), en cascade.
 */
const TUILES = [
  {
    icone: BookOpen,
    num: "02",
    titre: "Les codes du marché canadien, en une session",
    texte:
      "Doing Business in Canada : ce qu’il faut savoir avant d’envoyer votre premier conteneur.",
  },
  {
    icone: Building2,
    num: "03",
    titre: "Vos produits sous les bons regards",
    texte:
      "Les expositions mettent le savoir-faire malgache en vitrine devant celles et ceux qui achètent et investissent.",
  },
  {
    icone: MessageSquare,
    num: "04",
    titre: "Des rendez-vous calés avant d’arriver",
    texte:
      "Dans l’application, consultez les profils des participants et fixez vos rendez-vous B2B à l’avance.",
  },
  {
    icone: Send,
    num: "05",
    titre: "Une mission au Canada à gagner",
    texte:
      "Pitchez votre entreprise : le lauréat part en mission économique, vol, logement et per diem compris.",
  },
];

export function Pourquoi() {
  return (
    <section
      className="section clair papier scene"
      id="pourquoi"
      aria-labelledby="titre-pourquoi"
    >
      <div className="conteneur">
        <div className="tete">
          <h2
            id="titre-pourquoi"
            className="titre-section reveler"
            style={retard(80)}
          >
            Six raisons de{" "}
            <span className="saillant">bloquer votre 18 décembre</span>
          </h2>
          <p className="chapeau reveler" style={retard(160)}>
            Les conversations qui prennent des mois se font ici en une journée :
            dirigeants, acheteurs, investisseurs et institutions des deux pays,
            réunis au même endroit.
          </p>
        </div>

        <div className="bento">
          <article className="raison grande reveler-zoom" style={retard(120)}>
            <Image
              src="/traversee/public.jpg"
              alt="Participants attentifs dans la salle d’un événement CanCham"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
            <span className="num">01</span>
            <h3>Face aux décideurs, pas à leurs assistants</h3>
            <p>
              Dirigeants, acheteurs, investisseurs et institutions des deux
              pays, réunis dans une même salle.
            </p>
          </article>

          {TUILES.map((t, i) => {
            const Icone = t.icone;
            return (
              <article
                key={t.num}
                className="raison reveler-zoom"
                style={retard(200 + i * 80)}
              >
                <span className="ico" aria-hidden="true">
                  <Icone size={20} />
                </span>
                <span className="num">{t.num}</span>
                <h3>{t.titre}</h3>
                <p>{t.texte}</p>
              </article>
            );
          })}

          <article className="raison grande reveler-zoom" style={retard(520)}>
            <Image
              src="/traversee/groupe.jpg"
              alt="Photo de groupe des intervenants d’une rencontre CanCham"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
            <span className="num">06</span>
            <h3>Votre marque dans la lumière</h3>
            <p>
              Scène, direct, photos officielles, réseaux sociaux : une journée
              de visibilité auprès de tout l’écosystème Canada-Madagascar.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
