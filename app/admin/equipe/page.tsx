import { Lock } from "lucide-react";
import { ListeEquipe } from "@/components/admin/ListeEquipe";
import { EnTeteAdmin, Panneau } from "@/components/admin/ui";
import { FormulaireNouvelEquipier } from "@/components/forms/EquipeForms";
import { Saillant } from "@/components/ui";
import { estAdministrateur } from "@/lib/autorisations";
import { getAdministrateurs } from "@/lib/queries-admin";
import { getCurrentUser } from "@/lib/session";

export default async function AdminEquipe() {
  const [moi, admins] = await Promise.all([
    getCurrentUser("admin"),
    getAdministrateurs(),
  ]);
  const gere = estAdministrateur(moi);

  return (
    <>
      <EnTeteAdmin
        surtitre="Back-office"
        titre={
          <>
            Équipe &amp; <Saillant>accès</Saillant>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        {gere ? (
          <Panneau
            titre={
              <>
                Ajouter à <Saillant>l’équipe</Saillant>
              </>
            }
            sousTitre="Un compte de super admin ou d’admin, ouvert par vous"
            teinte="rouge"
          >
            <FormulaireNouvelEquipier />
          </Panneau>
        ) : (
          <Panneau titre="Votre rôle : admin" teinte="bleu">
            <div className="flex gap-3 items-start pb-2">
              <Lock size={18} className="text-faint shrink-0 mt-0.5" />
              <p className="m-0 text-[13.4px] text-muted">
                Vous avez accès à tout le back-office (membres, paiements,
                événements, contenus, messagerie), sauf à la gestion de l’équipe
                : ajouter quelqu’un, changer son rôle ou retirer son accès
                revient à un super admin.
              </p>
            </div>
          </Panneau>
        )}

        <Panneau
          titre="L’équipe"
          sousTitre={`${admins.length} compte${admins.length > 1 ? "s" : ""} avec accès au back-office`}
          teinte="degrade"
          corpsClassName="px-6 pb-3"
        >
          <ListeEquipe comptes={admins} moiId={moi.id} gere={gere} />
          <p className="m-0 mt-4 mb-3 text-[12px] text-faint">
            Un super admin ne peut ni retirer son propre accès ni changer son
            propre rôle : la plateforme en garde toujours au moins un.
          </p>
        </Panneau>
      </div>
    </>
  );
}
