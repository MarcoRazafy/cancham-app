import Link from "next/link";
import { ArrowRight, Headset, Mail, Phone } from "lucide-react";
import { CentreAide } from "@/components/CentreAide";
import { Card, Saillant, ViewHead } from "@/components/ui";
import { AIDE_CONTACT, THEMES } from "@/lib/aide";
import { chiffres } from "@/lib/coordonnees";

/**
 * Centre d'aide.
 *
 * La première porte : le membre cherche sa réponse, et seulement s'il ne la
 * trouve pas, il écrit à l'équipe — le lien est au pied de la page. Ouvert
 * même quand l'accès est restreint : « pourquoi mon accès est-il restreint ? »
 * est justement la question d'un membre bloqué.
 */
export default function AidePage() {
  const nombre = THEMES.reduce((n, t) => n + t.questions.length, 0);

  return (
    <>
      <ViewHead
        title={
          <>
            Besoin d’<Saillant>aide</Saillant> ?
          </>
        }
      >
        Les réponses aux questions les plus fréquentes sur la plateforme —{" "}
        {nombre} questions, classées par thème.
      </ViewHead>

      <div className="max-w-[860px]">
        <CentreAide themes={THEMES} />

        <Card className="tuile-hote carte-filet filet-fixe filet-degrade p-6 mt-9 flex gap-4 items-start flex-wrap">
          <span className="tuile tuile-sm tuile-rouge">
            <Headset size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[18px]">
              Vous ne trouvez pas votre <Saillant ton="vert">réponse</Saillant>{" "}
              ?
            </h2>
            <p className="m-0 mt-1 text-[13.6px] text-muted">
              Écrivez à l’équipe : la réponse arrive dans votre messagerie.
            </p>
            <div className="flex gap-x-5 gap-y-2 flex-wrap mt-3 text-[13.2px]">
              <a
                href={`tel:+${chiffres(AIDE_CONTACT.telephone)}`}
                className="inline-flex items-center gap-1.5 text-ink no-underline hover:underline"
              >
                <Phone size={14} className="text-faint" />{" "}
                {AIDE_CONTACT.telephone}
              </a>
              <a
                href={`mailto:${AIDE_CONTACT.email}`}
                className="inline-flex items-center gap-1.5 text-ink no-underline hover:underline"
              >
                <Mail size={14} className="text-faint" /> {AIDE_CONTACT.email}
              </a>
            </div>
          </div>
          <Link
            href="/membre/contact"
            className="btn-action btn-action-sm self-center"
          >
            Contacter l’équipe <ArrowRight size={14} />
          </Link>
        </Card>
      </div>
    </>
  );
}
