/**
 * Coquille des écrans d'identification : connexion, demande d'adhésion,
 * mot de passe oublié, nouveau mot de passe.
 *
 * Elle porte la classe `marque`, comme la vitrine : la charte CanCham —
 * couleurs, Montserrat et Open Sans — ne dépend pas du thème du visiteur.
 * Pas d'en-tête ni de pied : chaque écran occupe la fenêtre entière.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="marque min-h-screen flex flex-col">{children}</div>;
}
