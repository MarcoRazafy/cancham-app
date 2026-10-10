import Image from "next/image";
import { Compte } from "@/components/public/traversee/Compte";
import { COORDONNEES } from "@/lib/coordonnees";
import { fmtMoney } from "@/lib/format";
import { EVENEMENT, type Decompte } from "@/lib/traversee";

export function Final({
  prixPass,
  decompte,
}: {
  prixPass: number;
  decompte: Decompte;
}) {
  return (
    <section className="plein final nuit">
      <Image src="/traversee/public.jpg" alt="" fill sizes="100vw" />
      <div className="wrap">
        <p className="ou">
          {EVENEMENT.dateLisible} · {EVENEMENT.lieuCourt} · Places limitées
        </p>
        <h2>
          Le 18 décembre, <em>traversez avec nous.</em>
        </h2>
        <p className="rappel">
          Une journée pour faire affaire, une nuit pour célébrer 10 ans de pont
          entre le Canada et Madagascar.
        </p>
        <Compte decompte={decompte} />
        <div className="actions">
          <a className="btn btn-rouge" href="#billet">
            Réserver mon billet · {fmtMoney(prixPass)} →
          </a>
        </div>
        <p className="joindre">
          {COORDONNEES.email} · {COORDONNEES.telephone}
        </p>
      </div>
    </section>
  );
}
