import Image from "next/image";
import Link from "next/link";
import { CompteARebours } from "@/components/public/traversee/Mouvement";
import { fmtMoney } from "@/lib/format";
import { EVENEMENT, retard } from "@/lib/traversee";

/**
 * Dernier appel à réserver, sur une photo de salle voilée du dégradé de la
 * charte. `billetterie` : la fiche de l'événement ; `prixPass` : son tarif.
 */
export function Final({
  billetterie,
  prixPass,
}: {
  billetterie: string;
  prixPass: number;
}) {
  return (
    <section className="final scene" aria-labelledby="titre-final">
      <Image
        src="/traversee/public.jpg"
        alt=""
        fill
        sizes="100vw"
        style={{ objectFit: "cover" }}
      />
      <div className="conteneur final-in">
        <span className="surtitre reveler" style={{ color: "#fff" }}>
          {EVENEMENT.dateLisible} · {EVENEMENT.lieuCourt} · places limitées
        </span>
        <h2 id="titre-final" className="reveler" style={retard(80)}>
          Le 18 décembre, <span className="saillant">traversez avec nous.</span>
        </h2>
        <p className="reveler" style={retard(160)}>
          Une journée pour faire affaire, une nuit pour célébrer dix ans de pont
          entre le Canada et Madagascar.
        </p>
        <CompteARebours className="reveler" />
        <Link
          className="btn-action reveler"
          style={retard(320)}
          href={billetterie}
        >
          Réserver mon pass · {fmtMoney(prixPass)}{" "}
          <span className="fleche" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}

/**
 * Barre de réservation flottante. Invisible tant qu'on est sur le hero et
 * près du pied de page ; `Mouvement` la montre entre les deux.
 */
export function BarreFlottante({ billetterie }: { billetterie: string }) {
  return (
    <div className="flottante" id="flottante" aria-hidden="true">
      <div>
        <b>{EVENEMENT.nom} · 18 décembre</b>
        <span>Places limitées · un pass pour toute la journée</span>
      </div>
      <Link className="btn-action" href={billetterie} tabIndex={-1}>
        Réserver
      </Link>
    </div>
  );
}
