import { RenvoiApplication } from "@/components/Application";
import { BulleAssistance } from "@/components/public/BulleAssistance";
import { EnTetePublique, PiedPublique } from "@/components/public/CadreVitrine";
import { Scenes } from "@/components/public/Scenes";
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
 * d'où qu'on la lise, sans compte. `Scenes` fait entrer leurs sections au
 * défilement.
 */
export default function VitrineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Dans l'application installée, la vitrine ne se montre pas : elle reste
    // invisible le temps que `RenvoiApplication` mène vers l'espace membre.
    <div className="marque min-h-screen flex flex-col [@media(display-mode:standalone)]:invisible">
      <RenvoiApplication />
      <div className="vitrine-sombre flex flex-col min-h-screen">
        <EnTetePublique />
        {children}
        <PiedPublique />
        <BulleAssistance />
        <Scenes />
      </div>
    </div>
  );
}
