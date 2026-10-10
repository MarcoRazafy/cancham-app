import type { Decompte } from "@/lib/traversee";

const deux = (n: number) => String(n).padStart(2, "0");

export function Compte({
  decompte,
  libelle,
}: {
  decompte: Decompte;
  libelle?: string;
}) {
  return (
    <div
      className="compte"
      aria-label={libelle}
      aria-hidden={libelle ? undefined : true}
    >
      <div>
        <b data-cd="j">{decompte.j}</b>
        <small>JOURS</small>
      </div>
      <div>
        <b data-cd="h">{deux(decompte.h)}</b>
        <small>HEURES</small>
      </div>
      <div>
        <b data-cd="m">{deux(decompte.m)}</b>
        <small>MIN</small>
      </div>
      <div>
        <b data-cd="s">{deux(decompte.s)}</b>
        <small>SEC</small>
      </div>
    </div>
  );
}
