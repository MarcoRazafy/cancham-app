import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import { connection } from "next/server";
import { Ambiance } from "@/components/public/traversee/Ambiance";
import { Application } from "@/components/public/traversee/Application";
import { Billet } from "@/components/public/traversee/Billet";
import { Defis } from "@/components/public/traversee/Defis";
import { BarreFlottante, Final } from "@/components/public/traversee/Final";
import { Hero } from "@/components/public/traversee/Hero";
import { Mouvement } from "@/components/public/traversee/Mouvement";
import { Partenaires } from "@/components/public/traversee/Partenaires";
import { Pourquoi } from "@/components/public/traversee/Pourquoi";
import { Preuves } from "@/components/public/traversee/Preuves";
import { Programme } from "@/components/public/traversee/Programme";
import { Questions } from "@/components/public/traversee/Questions";
import { Solidarite } from "@/components/public/traversee/Solidarite";
import { getProchainEvenementIntitule } from "@/lib/queries";
import { EVENEMENT, lienBilletterie } from "@/lib/traversee";
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
  "Vendredi 18 décembre 2026 à la CCI Ivato : expositions, Doing Business in Canada, 5 à 7 d’affaires et grand Gala des 10 ans de la Chambre de Commerce et de Coopération Canada-Madagascar. Un pass pour toute la journée.";

export const metadata: Metadata = {
  title: "La Traversée — Gala des 10 ans",
  description: DESCRIPTION,
  alternates: { canonical: "/la-traversee" },
  openGraph: {
    title: "La Traversée — Gala des 10 ans de la CanCham",
    description: DESCRIPTION,
    type: "website",
    images: ["/traversee/hero.jpg"],
  },
};

export default async function LaTraverseePage() {
  await connection();
  const evenement = await getProchainEvenementIntitule(EVENEMENT.nom);
  const billetterie = lienBilletterie(evenement?.id ?? null);
  const prixPass =
    evenement && evenement.prixPublic > 0
      ? evenement.prixPublic
      : EVENEMENT.prixPass;

  return (
    <main
      className={`vitrine-claire la-traversee w-full flex-1 ${montserrat.variable} ${openSans.variable}`}
    >
      <div className="traversee" aria-hidden="true" />
      <Hero billetterie={billetterie} prixPass={prixPass} />
      <Preuves />
      <Programme />
      <Pourquoi />
      <Defis billetterie={billetterie} />
      <Ambiance />
      <Application />
      <Billet billetterie={billetterie} prixPass={prixPass} />
      <Solidarite />
      <Partenaires />
      <Questions />
      <Final billetterie={billetterie} prixPass={prixPass} />
      <BarreFlottante billetterie={billetterie} />
      <Mouvement />
    </main>
  );
}
