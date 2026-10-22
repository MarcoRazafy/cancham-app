import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import { connection } from "next/server";
import { Billet } from "@/components/public/traversee/Billet";
import { Defis } from "@/components/public/traversee/Defis";
import { BarreFlottante, Final } from "@/components/public/traversee/Final";
import { Hero } from "@/components/public/traversee/Hero";
import { Interactions } from "@/components/public/traversee/Interactions";
import { Plateforme } from "@/components/public/traversee/Plateforme";
import { Programme } from "@/components/public/traversee/Programme";
import { getProchainEvenementIntitule } from "@/lib/queries";
import { basePlateforme, decompte, EVENEMENT } from "@/lib/traversee";
import { Reservation } from "@/components/public/traversee/Reservation";
import "./traversee.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "swap",
});

const DESCRIPTION =
  "Vendredi 18 décembre 2026, Hôtel Carlton Antananarivo : une journée d’affaires et le Gala des 10 ans de la CanCham. Expositions, panels d’experts, réseautage 5 à 7, deux défis à gagner.";

export const metadata: Metadata = {
  title: "La Traversée — Gala des 10 ans",
  description: DESCRIPTION,
  alternates: { canonical: "/la-traversee" },
  openGraph: {
    title: "La Traversée — Gala des 10 ans · CanCham",
    description:
      "Une journée pour voir plus grand. Une nuit pour fêter 10 ans. Vendredi 18 décembre 2026, Hôtel Carlton.",
    type: "website",
    images: [
      {
        url: "/traversee/partage.jpg",
        width: 1200,
        height: 630,
        alt: "La Traversée — Une journée pour voir plus grand. Une nuit pour fêter 10 ans.",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
};

export default async function LaTraverseePage() {
  await connection();
  const evenement = await getProchainEvenementIntitule(EVENEMENT.nom);
  const prixPass =
    evenement && evenement.prixPublic > 0
      ? evenement.prixPublic
      : EVENEMENT.prixPass;
  const compte = decompte();

  return (
    <main
      className={`vitrine-claire la-traversee w-full flex-1 ${montserrat.variable} ${openSans.variable}`}
    >
      <Interactions />
      <Hero prixPass={prixPass} decompte={compte} />
      <Programme />
      <Defis />
      <Plateforme decompte={compte} />
      <Billet prixPass={prixPass} />
      <Final prixPass={prixPass} decompte={compte} />
      <BarreFlottante prixPass={prixPass} />
      <Reservation
        plateforme={basePlateforme(process.env.TRAVERSEE_PLATEFORME_URL)}
        prixPass={prixPass}
      />
    </main>
  );
}
