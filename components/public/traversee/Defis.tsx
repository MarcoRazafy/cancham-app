import Image from "next/image";
import Link from "next/link";
import { Check, Heart, Image as ImageIcon } from "lucide-react";
import { fmtMoney } from "@/lib/format";
import { EVENEMENT, retard } from "@/lib/traversee";

/**
 * Les trois défis, sur le dégradé de la charte. Chaque carte se soulève au
 * survol et déroule un filet rouge vers vert à sa base.
 *
 * `billetterie` : où réserver — la fiche de l'événement sur la plateforme.
 */
const DEFIS = [
  {
    num: 1,
    quand: "Avant le gala",
    titre: "« J’y serai »",
    lot: fmtMoney(EVENEMENT.prixDefi),
    texte:
      "Annoncez votre venue sur Facebook ou Instagram en taguant la CanCham. La publication la plus populaire remporte le prix, annoncé pendant la soirée.",
    regle: "Le plus de réactions l’emporte",
    icone: Heart,
    photo: "/traversee/oratrice.jpg",
    alt: "Participante au micro lors d’un événement CanCham",
  },
  {
    num: 2,
    quand: "Vote le 18 déc.",
    titre: "Pitch MECC",
    lot: "Mission tout inclus",
    texte:
      "Déposez la vidéo de pitch de votre entreprise. Le jury retient dix projets, dévoilés au gala, et le public désigne le lauréat en direct.",
    regle: "Une voix par pass",
    icone: Check,
    photo: "/traversee/pitch.jpg",
    alt: "Intervenante présentant son projet lors d’une rencontre CanCham",
  },
  {
    num: 3,
    quand: "Après le gala",
    titre: "« J’y étais »",
    lot: fmtMoney(EVENEMENT.prixDefi),
    texte:
      "Partagez votre plus belle photo de la journée en taguant la CanCham. Le 28 décembre à 19 h, la publication la plus populaire l’emporte.",
    regle: "Résultat en direct à J+10",
    icone: ImageIcon,
    photo: "/traversee/diner.jpg",
    alt: "Canapés servis lors d’un cocktail CanCham",
  },
];

export function Defis({ billetterie }: { billetterie: string }) {
  return (
    <section
      className="section defis scene"
      id="defis"
      aria-labelledby="titre-defis"
    >
      <div className="conteneur">
        <div className="tete ligne">
          <div>
            <h2
              id="titre-defis"
              className="titre-section reveler"
              style={retard(80)}
            >
              Venez pour le réseau.{" "}
              <span className="saillant" style={{ color: "var(--vert-vif)" }}>
                Repartez avec un lot.
              </span>
            </h2>
          </div>
          <p
            className="chapeau reveler"
            style={{ ...retard(160), color: "rgb(255 255 255 / .8)" }}
          >
            10 000 000 Ar et une mission au Canada se jouent avant, pendant et
            après la journée, depuis l’application de la Traversée.
          </p>
        </div>

        <div className="cartes-defis">
          {DEFIS.map((d, i) => {
            const Icone = d.icone;
            return (
              <article
                key={d.num}
                className="defi reveler-zoom"
                style={retard(120 + i * 120)}
              >
                <div className="defi-visuel">
                  <Image
                    src={d.photo}
                    alt={d.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    style={{ objectFit: "cover" }}
                  />
                  <span className="defi-num">{d.num}</span>
                  <span className="defi-quand">{d.quand}</span>
                </div>
                <div className="defi-corps">
                  <h3>{d.titre}</h3>
                  <span className="lot tnum">{d.lot}</span>
                  <p>{d.texte}</p>
                  <span className="regle">
                    <Icone size={16} aria-hidden="true" />
                    {d.regle}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <p className="note reveler" style={retard(460)}>
          <span>
            Ouvert aux détenteurs d’un pass nominatif. Une participation par
            personne et par défi. Règlement complet publié dans l’application.
          </span>
          <Link className="btn-contour" href={billetterie}>
            Réserver pour participer
          </Link>
        </p>
      </div>
    </section>
  );
}
