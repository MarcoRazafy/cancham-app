import { Briefcase, CreditCard, Tag } from "lucide-react";
import { Compteur, EnTeteAdmin, Vide } from "@/components/admin/ui";
import { ServiceCard } from "@/components/domain";
import {
  DeleteServiceButton,
  DeplacerServiceButton,
  ServiceFormButton,
} from "@/components/forms/ContentForms";
import { Card, Saillant } from "@/components/ui";
import { getServices } from "@/lib/queries";
import type { CanchamService } from "@/lib/types";

export default async function AdminServices() {
  const services = await getServices();
  const gratuits = services.filter((s) => s.type === "gratuit");
  const payants = services.filter((s) => s.type === "payant");

  const liste = (titre: string, aide: string, items: CanchamService[]) => (
    <section className="mb-8">
      <h2 className="text-[19px] m-0">{titre}</h2>
      <p className="text-[13px] text-muted m-0 mt-1 mb-4">{aide}</p>
      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((s, i) => (
            <ServiceCard
              key={s.id}
              service={s}
              action={
                <div className="flex items-center gap-1.5 w-full flex-wrap">
                  <ServiceFormButton service={s} />
                  <span className="flex-1" />
                  <DeplacerServiceButton
                    serviceId={s.id}
                    sens="haut"
                    desactive={i === 0}
                  />
                  <DeplacerServiceButton
                    serviceId={s.id}
                    sens="bas"
                    desactive={i === items.length - 1}
                  />
                  <DeleteServiceButton serviceId={s.id} titre={s.titre} />
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <Card>
          <Vide>Aucun service dans cette liste.</Vide>
        </Card>
      )}
    </section>
  );

  return (
    <>
      <EnTeteAdmin
        surtitre="Programme"
        titre={
          <>
            Services <Saillant ton="vert">CanCham</Saillant>
          </>
        }
        actions={<ServiceFormButton />}
      >
        Ce que la chambre propose à ses membres, inclus dans l’adhésion ou
        facturé. L’ordre choisi ici est celui que voient les membres.
      </EnTeteAdmin>

      <div className="grid gap-4 mb-7 sm:grid-cols-3">
        <Compteur
          icone={<Briefcase size={22} />}
          teinte="bleu"
          libelle="Services proposés"
          valeur={services.length}
        />
        <Compteur
          icone={<Tag size={22} />}
          teinte="vert"
          libelle="Inclus dans l’adhésion"
          valeur={gratuits.length}
        />
        <Compteur
          icone={<CreditCard size={22} />}
          teinte="rouge"
          libelle="Payants"
          valeur={payants.length}
        />
      </div>

      {liste(
        "Inclus dans l’adhésion",
        "Présentés en vert aux membres, avec l’étiquette « Gratuit ».",
        gratuits,
      )}
      {liste(
        "Services payants",
        "Présentés en rouge, avec leur tarif.",
        payants,
      )}
    </>
  );
}
