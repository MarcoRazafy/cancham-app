import { Suspense } from "react";
import type { Metadata } from "next";
import { Toast } from "@/components/Toast";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
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
        className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}
      >
        {children}
        <Suspense>
          <Toast />
        </Suspense>
      </body>
    </html>
  );
}
