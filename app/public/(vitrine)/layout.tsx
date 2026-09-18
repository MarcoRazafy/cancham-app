import { EnTetePublique, PiedPublique } from "@/components/public/Marque";

/**
 * Pages vitrine — accueil détaillé et fiche publique d'un événement.
 *
 * Elles ne sont plus reliées à la connexion : l'espace public se limite
 * désormais à s'identifier ou à demander son adhésion. Elles restent en place,
 * atteignables par leur adresse, prêtes à resservir.
 */
export default function VitrineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <EnTetePublique />
      {children}
      <PiedPublique />
    </div>
  );
}
