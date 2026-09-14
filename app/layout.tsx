import { Suspense } from "react";
import type { Metadata } from "next";
import { Toast } from "@/components/Toast";
import {
  Fraunces,
  Hammersmith_One,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Inter,
} from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/**
 * Polices de l'espace public, relevées sur le site de la chambre : Hammersmith
 * One pour les titres, Inter pour le texte courant.
 *
 * Hammersmith One n'existe qu'en graisse 400. Les titres ne doivent donc jamais
 * porter de font-weight supérieur, sous peine de gras synthétique — la règle est
 * posée dans globals.css. La hiérarchie repose sur la taille, pas sur la graisse.
 *
 * Les espaces membre et back-office gardent leur propre pile.
 */
const hammersmith = Hammersmith_One({
  variable: "--font-hammersmith",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CanCham Connect",
  description:
    "Portail membre et back-office de la Chambre de Commerce et de Coopération Canada–Madagascar.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body
        className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} ${hammersmith.variable} ${inter.variable}`}
      >
        {children}
        <Suspense>
          <Toast />
        </Suspense>
      </body>
    </html>
  );
}
