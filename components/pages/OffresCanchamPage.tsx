import { ServiceCard } from "@/components/domain";
import { BoutonReservation } from "@/components/forms/BoutonReservation";
import { EmptyState, Saillant, SectionTitle, ViewHead } from "@/components/ui";
import { getServices } from "@/lib/queries";
import { getTypesRendezvous } from "@/lib/rendezvous-donnees";
import { typeDuLienRendezvous } from "@/lib/liens";

/**
 * Services proposés par la chambre, vus par les membres. À ne pas confondre
 * avec les offres publiées par les membres entre eux, qui vivent dans le rail
 * des actualités. L'équipe les gère depuis le back-office.
 */
export async function OffresCanchamPage() {
  const [services, types] = await Promise.all([
    getServices(),
    getTypesRendezvous(),
  ]);
  // Un service peut mener à un rendez-vous que l'équipe a masqué, supprimé ou
  // vidé de ses heures depuis : son bouton ne doit pas finir dans une
  // impasse. Il redevient alors la demande par message.
  const ouverts = new Set(
    types.filter((t) => t.plages.length).map((t) => t.id),
  );
  const lienDe = (lien?: string | null) => {
    if (!lien) return null;
    const type = typeDuLienRendezvous(lien);
    return type && !ouverts.has(type) ? null : lien;
  };
  const gratuits = services.filter((s) => s.type === "gratuit");
  const payants = services.filter((s) => s.type === "payant");

  return (
    <>
      <ViewHead title={<>Offres {<Saillant ton="vert">CanCham</Saillant>}</>} />

      <SectionTitle>Services gratuits</SectionTitle>
      <div className="cascade grid gap-4 mb-7 md:grid-cols-2 lg:grid-cols-3">
        {gratuits.length ? (
          gratuits.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              action={
                <BoutonReservation
                  serviceId={s.id}
                  payant={false}
                  lien={lienDe(s.lien)}
                />
              }
            />
          ))
        ) : (
          <EmptyState>Aucun service gratuit pour le moment.</EmptyState>
        )}
      </div>

      <SectionTitle>Services payants</SectionTitle>
      <div className="cascade grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {payants.length ? (
          payants.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              action={
                <BoutonReservation
                  serviceId={s.id}
                  payant
                  lien={lienDe(s.lien)}
                />
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
