import { ServiceCard } from "@/components/domain";
import { EmptyState, Saillant, SectionTitle, ViewHead } from "@/components/ui";
import {
  DeleteServiceButton,
  ServiceFormButton,
} from "@/components/forms/ContentForms";
import { getServices } from "@/lib/queries";
import type { Space } from "@/lib/types";

/**
 * Services proposés par la chambre. À ne pas confondre avec les offres publiées
 * par les membres entre eux, qui vivent dans le rail des actualités.
 */
export async function OffresCanchamPage({ space }: { space: Space }) {
  const admin = space === "admin";
  const services = await getServices();
  const gratuits = services.filter((s) => s.type === "gratuit");
  const payants = services.filter((s) => s.type === "payant");

  return (
    <>
      <ViewHead
        title={<>Offres {<Saillant ton="vert">CanCham</Saillant>}</>}
        action={admin ? <ServiceFormButton /> : null}
      >
        L’ensemble des services proposés par la chambre à ses membres, gratuits
        ou payants, en complément des promotions publiées par les membres
        eux-mêmes.
      </ViewHead>

      <SectionTitle>Services gratuits</SectionTitle>
      <div className="grid gap-4 mb-7 md:grid-cols-2 lg:grid-cols-3">
        {gratuits.length ? (
          gratuits.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              action={
                admin ? (
                  <>
                    <ServiceFormButton service={s} />
                    <DeleteServiceButton serviceId={s.id} />
                  </>
                ) : null
              }
            />
          ))
        ) : (
          <EmptyState>Aucun service gratuit pour le moment.</EmptyState>
        )}
      </div>

      <SectionTitle>Services payants</SectionTitle>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {payants.length ? (
          payants.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              action={
                admin ? (
                  <>
                    <ServiceFormButton service={s} />
                    <DeleteServiceButton serviceId={s.id} />
                  </>
                ) : null
              }
            />
          ))
        ) : (
          <EmptyState>Aucun service payant pour le moment.</EmptyState>
        )}
      </div>
    </>
  );
}
