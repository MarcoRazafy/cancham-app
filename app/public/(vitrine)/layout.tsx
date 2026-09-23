import { BulleAssistance } from "@/components/public/BulleAssistance";
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
 *
 * La bulle d'assistance les accompagne toutes : une question se pose d'où
 * qu'on la lise, sans compte.
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
      {/* Qui n'a pas de compte pose sa question ici, sans quitter la page. */}
      <BulleAssistance />
    </div>
  );
}
