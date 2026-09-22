import { EnTetePublique, PiedPublique } from "@/components/public/CadreVitrine";
import "./vitrine.css";

/**
 * Pages vitrine — accueil détaillé et fiche publique d'un événement.
 *
 * En sombre, comme l'en-tête du site cancham.mg (`vitrine.css`) ; les pages
 * de connexion, elles, restent claires.
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
    <div className="vitrine-sombre flex flex-col min-h-screen">
      <EnTetePublique />
      {children}
      <PiedPublique />
    </div>
  );
}
