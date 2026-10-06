import Image from "next/image";
import { LIENS } from "@/lib/traversee";

/**
 * L'action solidaire du gala : Hope for a Better Life. Un encadré vert, deux
 * photos à gauche, le propos et les deux chiffres à droite.
 *
 * « Soutenir le projet » écrit à la chambre (voir `LIENS.dons`) : la
 * plateforme n'a pas encore de page de dons.
 */
export function Solidarite() {
  return (
    <section
      className="section clair scene"
      id="solidarite"
      aria-labelledby="titre-hope"
    >
      <div className="conteneur">
        <div className="hope reveler">
          <div className="hope-img">
            <div>
              <Image
                src="/traversee/equipe.jpg"
                alt="Équipe à l’accueil"
                fill
                sizes="(max-width: 900px) 50vw, 25vw"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div>
              <Image
                src="/traversee/reseau.jpg"
                alt="Deux femmes en discussion"
                fill
                sizes="(max-width: 900px) 50vw, 25vw"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
          <div className="hope-txt">
            <h2 id="titre-hope">
              Une journée qui compte{" "}
              <span className="saillant" style={{ color: "#bfe6d1" }}>
                aussi pour elles
              </span>
            </h2>
            <p>
              La Traversée soutient Hope for a Better Life, qui forme des mères
              célibataires en difficulté pour qu’elles gagnent leur autonomie
              financière. Pour soutenir le projet, écrivez-nous : nous vous
              indiquons comment verser votre don.
            </p>
            <div className="hope-nums">
              <div>
                <b className="tnum">100</b>
                <span>femmes formées en deux ans</span>
              </div>
              <div>
                <b className="tnum">50</b>
                <span>dès 2026</span>
              </div>
            </div>
            <a className="btn-blanc" href={LIENS.dons}>
              Soutenir le projet
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
