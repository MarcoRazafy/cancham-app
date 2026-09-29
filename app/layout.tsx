import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { EnregistrementApplication } from "@/components/Application";
import { RetoursFormulaire } from "@/components/Mouvement";
import { Toast } from "@/components/Toast";
import {
  Fraunces,
  Hammersmith_One,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Inter,
} from "next/font/google";
import { baseSite } from "@/lib/site";
import "./globals.css";

/**
 * Fraunces porte les titres des espaces membre et back-office.
 *
 * L'italique est chargé explicitement : les mots saillants des titres le
 * réclament, et sans le fichier le navigateur se rabat sur une inclinaison
 * synthétique — un vrai italique de Fraunces redessine ses lettres, l'oblique
 * se contente de les pencher.
 */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
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
  // L'italique sert aux mots saillants des titres publics : Hammersmith One
  // n'existe qu'en romain, et une inclinaison synthétique s'y verrait.
  style: ["normal", "italic"],
  display: "swap",
});

/**
 * Métadonnées communes.
 *
 * `metadataBase` donne aux adresses relatives — canoniques, images de partage
 * — le domaine réel du site : sans elle, un lien partagé pointerait vers
 * `localhost`. Le gabarit de titre suffixe chaque page du nom de la chambre.
 */
export const metadata: Metadata = {
  metadataBase: new URL(baseSite()),
  title: {
    default:
      "CanCham — Chambre de Commerce et de Coopération Canada–Madagascar",
    template: "%s · CanCham",
  },
  description:
    "Le réseau des entreprises du Canada et de Madagascar : événements, mises en relation et accompagnement à l’export.",
  // L'application installée : son nom sous l'icône, et l'écran d'accueil
  // d'un iPhone qui l'ouvre sans barre d'adresse.
  applicationName: "CanCham Connect",
  appleWebApp: {
    capable: true,
    title: "CanCham",
    statusBarStyle: "default",
  },
};

/** Le bleu de la barre supérieure, prolongé par la barre d'état du téléphone. */
export const viewport: Viewport = {
  themeColor: "#0f1d2c",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /*
      Les variables de polices vont sur `<html>`, pas sur `<body>`.

      La charte les compose — `--font-display: var(--font-fraunces), …` —, et
      ces compositions sont déclarées sur `:root`, c'est-à-dire sur `<html>`.
      Une propriété personnalisée se résout là où elle est déclarée : posées un
      cran plus bas, sur `<body>`, les polices restaient invisibles à
      `--font-display`, qui devenait invalide et entraînait tout le site dans
      la police système. Fraunces, Hammersmith One et Inter étaient chargées et
      jamais utilisées.
    */
    <html
      lang="fr"
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} ${hammersmith.variable} ${inter.variable}`}
    >
      <body>
        {children}
        <Suspense>
          <Toast />
          <RetoursFormulaire />
        </Suspense>
        <EnregistrementApplication />
      </body>
    </html>
  );
}
