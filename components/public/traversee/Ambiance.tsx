import type { CSSProperties } from "react";
import Image from "next/image";
import { retard } from "@/lib/traversee";

/**
 * Mosaïque des rencontres CanCham, sur une grille sans trou. Chaque photo
 * grandit légèrement en entrant, l'une après l'autre ; au survol elle zoome
 * et sa légende glisse vers le haut.
 */
/*
 * Grille de 6 colonnes sur 3 rangées, remplie sans trou :
 *   [ salle  salle  | oratrice | cocktail | public  public ]
 *   [ salle  salle  | oratrice | rdv      | public  public ]
 *   [ musique | equipe | groupe  groupe  groupe  | formation ]
 * `zone` = ligne / colonne de départ et de fin (grid-area).
 */
const PHOTOS = [
  {
    src: "/traversee/salle.jpg",
    alt: "Salle comble lors d’une rencontre CanCham",
    legende: "La salle",
    zone: "1 / 1 / 3 / 3",
  },
  {
    src: "/traversee/oratrice.jpg",
    alt: "Prise de parole au pupitre",
    legende: "Prises de parole",
    zone: "1 / 3 / 3 / 4",
  },
  {
    src: "/traversee/diner.jpg",
    alt: "Canapés du cocktail",
    legende: "Cocktail",
    zone: "1 / 4 / 2 / 5",
  },
  {
    src: "/traversee/rdv.jpg",
    alt: "Réunion autour d’une table",
    legende: "Rendez-vous B2B",
    zone: "2 / 4 / 3 / 5",
  },
  {
    src: "/traversee/assistance.jpg",
    alt: "Assistance attentive",
    legende: "Le public",
    zone: "1 / 5 / 3 / 7",
  },
  {
    src: "/traversee/musique.jpg",
    alt: "Musiciens",
    legende: "Musique",
    zone: "3 / 1 / 4 / 2",
  },
  {
    src: "/traversee/equipe.jpg",
    alt: "Équipe CanCham à l’accueil",
    legende: "L’équipe",
    zone: "3 / 2 / 4 / 3",
  },
  {
    src: "/traversee/groupe.jpg",
    alt: "Photo de groupe",
    legende: "Les intervenants",
    zone: "3 / 3 / 4 / 6",
  },
  {
    src: "/traversee/formation.jpg",
    alt: "Intervenante en formation",
    legende: "Formation",
    zone: "3 / 6 / 4 / 7",
  },
];

export function Ambiance() {
  return (
    <section
      className="section clair scene"
      id="ambiance"
      aria-labelledby="titre-ambiance"
    >
      <div className="conteneur">
        <div className="tete">
          <h2
            id="titre-ambiance"
            className="titre-section reveler"
            style={retard(80)}
          >
            Une journée d’affaires,{" "}
            <span className="saillant rouge">une nuit de fête</span>
          </h2>
        </div>
        <div className="mosaique">
          {PHOTOS.map((p, i) => (
            <figure
              key={p.src}
              className="reveler-zoom"
              style={
                { ...retard(60 + i * 60), "--zone": p.zone } as CSSProperties
              }
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                style={{ objectFit: "cover" }}
              />
              <figcaption>{p.legende}</figcaption>
            </figure>
          ))}
        </div>
        <p className="legende">Photos des rencontres CanCham 2025 et 2026.</p>
      </div>
    </section>
  );
}
