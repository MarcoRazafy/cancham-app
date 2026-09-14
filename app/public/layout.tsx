import { PiedPublique } from "@/components/public/Marque";

/**
 * Coquille de l'espace public.
 *
 * Elle porte la classe `marque`, qui applique la charte CanCham — couleurs,
 * Montserrat et Open Sans — indépendamment du thème du visiteur : une vitrine
 * ne doit pas changer d'apparence selon les réglages du navigateur.
 *
 * L'en-tête n'est pas ici : la page d'accueil intègre le logo dans sa bannière,
 * les pages secondaires utilisent `EnTetePublique`.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marque min-h-screen flex flex-col">
      {children}
      <PiedPublique />
    </div>
  );
}
