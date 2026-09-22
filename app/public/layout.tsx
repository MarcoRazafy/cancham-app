/**
 * Coquille de l'espace public.
 *
 * Elle porte la classe `marque`, qui applique la charte CanCham — couleurs,
 * Montserrat et Open Sans — indépendamment du thème du visiteur : une vitrine
 * ne doit pas changer d'apparence selon les réglages du navigateur.
 *
 * L'en-tête et le pied sont ceux de la vitrine, dans `(vitrine)`. Les écrans
 * de connexion et d'inscription vivent à part, sous `/auth`.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="marque min-h-screen flex flex-col">{children}</div>;
}
