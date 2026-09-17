import { EnTetePublique, PiedPublique } from "@/components/public/Marque";

/**
 * Coquille de l'espace public.
 *
 * Elle porte la classe `marque`, qui applique la charte CanCham — couleurs,
 * Montserrat et Open Sans — indépendamment du thème du visiteur : une vitrine
 * ne doit pas changer d'apparence selon les réglages du navigateur.
 *
 * En-tête et pied sont communs à toutes les pages : l'en-tête blanc précède la
 * bannière d'accueil au lieu de s'y superposer.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marque min-h-screen flex flex-col">
      <EnTetePublique />
      {children}
      <PiedPublique />
    </div>
  );
}
