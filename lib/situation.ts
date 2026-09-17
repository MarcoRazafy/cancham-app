import { fmtDate } from "@/lib/format";
import {
  RETARD_BLOCAGE_JOURS,
  fmtCotisation,
  joursDeRetard,
  libelleFormule,
  retardBloque,
} from "@/lib/membership";
import type { Member } from "@/lib/types";

/**
 * Où en est un membre, et ce que l'équipe doit faire.
 *
 * Un statut seul ne dit pas l'urgence : deux membres « en retard » ne se
 * traitent pas pareil à 5 jours et à 45. La situation l'écrit en clair et
 * nomme l'action attendue.
 */
export interface Situation {
  detail: string;
  /** Verbe de l'action attendue, ou `null` si rien n'est à faire. */
  action: string | null;
  urgent: boolean;
}

export function situation(m: Member): Situation {
  switch (m.statut) {
    case "candidature":
      return {
        detail: `Demande déposée le ${fmtDate(m.adhesion, { day: "numeric", month: "long" })} · ${libelleFormule(m.formule)}`,
        action: "Examiner",
        urgent: false,
      };
    case "en_attente":
      return {
        detail: `Approuvée · cotisation attendue : ${fmtCotisation(m.formule)}`,
        action: "Encaisser",
        urgent: false,
      };
    case "en_retard": {
      const jours = joursDeRetard(m);
      const bloque = retardBloque(m);
      return {
        detail: bloque
          ? `${jours} jours de retard · accès bloqué`
          : `${jours} jour${jours > 1 ? "s" : ""} de retard · blocage dans ${RETARD_BLOCAGE_JOURS - jours + 1} j`,
        action: "Relancer",
        urgent: bloque,
      };
    }
    default:
      return {
        detail: `Membre depuis ${fmtDate(m.adhesion, { month: "long", year: "numeric" })}`,
        action: null,
        urgent: false,
      };
  }
}
