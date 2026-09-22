import { CheckCircle2, MailCheck, UserX } from "lucide-react";
import { AccederButton } from "@/components/forms/MemberForms";
import { Pill } from "@/components/ui";
import type { AccesMembre } from "@/lib/acces-membres";
import { fmtDate } from "@/lib/format";

/**
 * Où en est l'accès d'un membre, et le bouton qui l'ouvre.
 *
 * Accès actif : rien à faire. Lien envoyé : on peut le renvoyer. Rien
 * d'envoyé : « Accéder ». Sans contact : personne à qui écrire.
 */
export function EtatAcces({
  acces,
  memberId,
  nom,
  candidature,
  retour,
  large = false,
}: {
  acces: AccesMembre;
  memberId: string;
  nom: string;
  candidature: boolean;
  retour: string;
  /** Dans le panneau de la fiche : bouton pleine largeur, détail visible. */
  large?: boolean;
}) {
  const bouton = (renvoi: boolean) => (
    <AccederButton
      memberId={memberId}
      nom={nom}
      candidature={candidature}
      renvoi={renvoi}
      retour={retour}
      large={large}
    />
  );

  // Une candidature se valide d'abord : le bouton, quel que soit le lien.
  if (candidature && acces.contact) return bouton(false);

  switch (acces.etat) {
    case "actif":
      return (
        <Pill tone="ok" icon={<CheckCircle2 size={11} />}>
          Accès actif
        </Pill>
      );
    case "invite":
      return (
        <span
          className={`flex gap-2 ${large ? "flex-col" : "items-center flex-wrap"}`}
        >
          <Pill tone="warn" icon={<MailCheck size={11} />}>
            Lien envoyé le{" "}
            {fmtDate(acces.inviteLe!, { day: "numeric", month: "short" })}
          </Pill>
          {bouton(true)}
        </span>
      );
    case "a_envoyer":
      return bouton(false);
    case "sans_contact":
      return <Pill icon={<UserX size={11} />}>Sans contact</Pill>;
  }
}
