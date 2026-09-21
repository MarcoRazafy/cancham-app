/**
 * Enveloppe de chaque page : elle est recréée à chaque navigation, ce qui
 * rejoue l'entrée — la page arrive en glissant à peine vers le haut. Le menu
 * et la barre du haut, dans la mise en page, ne bougent pas.
 */
export default function EntreePage({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="entree-page">{children}</div>;
}
