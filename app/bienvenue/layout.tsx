import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bienvenue · CanCham Connect" };

/**
 * Coquille de l'accueil d'un nouvel inscrit : plein écran, aux couleurs de
 * l'espace public, comme l'inscription dont il est la suite. Pas de menu :
 * on se présente d'abord, on découvre l'espace ensuite.
 */
export default function BienvenueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="marque min-h-screen flex flex-col">{children}</div>;
}
