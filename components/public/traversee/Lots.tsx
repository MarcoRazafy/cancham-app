"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Send, Trophy, Sparkles } from "lucide-react";
import { LienAncre } from "@/components/public/LienAncre";
import { fmtMoney } from "@/lib/format";
import { EVENEMENT } from "@/lib/traversee";

const LOTS = [
  {
    icone: Trophy,
    ton: "rouge",
    valeur: `2 × ${fmtMoney(EVENEMENT.prixDefi)}`,
    detail: "deux défis photo, avant et après le gala",
  },
  {
    icone: Send,
    ton: "vert",
    valeur: "Une mission au Canada",
    detail: "tout inclus, pour le lauréat du Pitch MECC",
  },
  {
    icone: Sparkles,
    ton: "or",
    valeur: `${fmtMoney(EVENEMENT.prixDefi * 2)} de lots`,
    detail: "et dix finalistes sur scène le 18 décembre",
  },
] as const;

const INTERVALLE_MS = 3400;

export function Lots() {
  const [actif, setActif] = useState(0);
  const [anime, setAnime] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const horloge = window.setInterval(
      () => setActif((i) => (i + 1) % LOTS.length),
      INTERVALLE_MS,
    );
    return () => window.clearInterval(horloge);
  }, []);

  return (
    <div
      className="lots-barre"
      role="region"
      aria-label="À gagner"
      onMouseEnter={() => setAnime(false)}
      onMouseLeave={() => setAnime(true)}
      data-pause={anime ? undefined : ""}
    >
      <span className="lots-etiquette">
        <i className="lots-pouls" aria-hidden="true" />À gagner
      </span>

      <div className="lots-fenetre" aria-live="polite">
        {LOTS.map((l, i) => {
          const Icone = l.icone;
          const etat =
            i === actif
              ? "actif"
              : i === (actif + LOTS.length - 1) % LOTS.length
                ? "sorti"
                : "attente";
          return (
            <div
              key={l.valeur}
              className={`lots-item ${etat} ton-${l.ton}`}
              aria-hidden={i !== actif}
            >
              <span className="lots-ico" aria-hidden="true">
                <Icone size={16} />
              </span>
              <span className="lots-texte">
                <b className="tnum">{l.valeur}</b>
                <small>{l.detail}</small>
              </span>
            </div>
          );
        })}
      </div>

      <div className="lots-points" aria-hidden="true">
        {LOTS.map((l, i) => (
          <button
            key={l.valeur}
            type="button"
            className={i === actif ? "on" : ""}
            onClick={() => setActif(i)}
            tabIndex={-1}
          />
        ))}
      </div>

      <LienAncre className="lots-lien" href="#defis">
        Voir les défis <ArrowRight size={15} aria-hidden="true" />
      </LienAncre>
      <span className="lots-reflet" aria-hidden="true" />
    </div>
  );
}
