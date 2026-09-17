import { ServiceCard } from "@/components/domain";
import { EmptyState, Saillant, SectionTitle, ViewHead } from "@/components/ui";
import { getServices } from "@/lib/queries";

/**
 * Services proposés par la chambre, vus par les membres. À ne pas confondre
 * avec les offres publiées par les membres entre eux, qui vivent dans le rail
 * des actualités. L'équipe les gère depuis le back-office.
 */
export async function OffresCanchamPage() {
  const services = await getServices();
  const gratuits = services.filter((s) => s.type === "gratuit");
  const payants = services.filter((s) => s.type === "payant");

  return (
    <>
      <ViewHead title={<>Offres {<Saillant ton="vert">CanCham</Saillant>}</>}>
        L’ensemble des services proposés par la chambre à ses membres, gratuits
        ou payants, en complément des promotions publiées par les membres
        eux-mêmes.
      </ViewHead>

      <SectionTitle>Services gratuits</SectionTitle>
      <div className="grid gap-4 mb-7 md:grid-cols-2 lg:grid-cols-3">
        {gratuits.length ? (
          gratuits.map((s) => <ServiceCard key={s.id} service={s} />)
        ) : (
          <EmptyState>Aucun service gratuit pour le moment.</EmptyState>
        )}
      </div>

      <SectionTitle>Services payants</SectionTitle>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {payants.length ? (
          payants.map((s) => <ServiceCard key={s.id} service={s} />)
        ) : (
          <EmptyState>Aucun service payant pour le moment.</EmptyState>
        )}
      </div>
    </>
  );
}
