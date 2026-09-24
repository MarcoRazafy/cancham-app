import { BulleAssistance } from "@/components/public/BulleAssistance";
import { EnTetePublique, PiedPublique } from "@/components/public/CadreVitrine";
import "./vitrine.css";

/**
 * La vitrine : ce qu'un visiteur voit à la racine du domaine, sans compte.
 *
 * Elle porte la classe `marque`, qui applique la charte CanCham — couleurs et
 * fontes — indépendamment du thème du navigateur : une vitrine ne change pas
 * d'apparence selon les réglages de qui la regarde. Par-dessus,
 * `vitrine-sombre` pose le bleu nuit du site de la chambre (`vitrine.css`) ;
 * les écrans de connexion, sous `/auth`, restent clairs.
 *
 * La bulle d'assistance accompagne toutes ces pages : une question se pose
 * d'où qu'on la lise, sans compte.
 */
export default function VitrineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marque min-h-screen flex flex-col">
      <div className="vitrine-sombre flex flex-col min-h-screen">
        <EnTetePublique />
        {children}
        <PiedPublique />
        <BulleAssistance />
      </div>
    </div>
  );
}
