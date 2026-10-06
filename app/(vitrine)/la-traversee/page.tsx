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

/**
 * Polices de la charte CanCham (page « Polices de caractère à utiliser ») :
 * Montserrat pour les titres, en gras ; Open Sans pour les paragraphes.
 *
 * Chargées ici et non dans la mise en page : seule cette page les porte, le
 * reste de la vitrine garde Hammersmith One et Inter, les fontes du site de
 * la chambre. L'italique de Montserrat sert aux mots saillants des titres :
 * un vrai italique redessine les lettres, une inclinaison synthétique se
 * contente de les pencher.
 */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  // Police variable : un seul fichier couvre toutes les graisses. Demander
  // des graisses précises donne à Turbopack des adresses qu'il ne sait pas
  // lire (« next/font/google queries have exactly one entry »).
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

/**
 * Page publique de la Traversée, le Gala des 10 ans.
 *
 * Elle s'ouvre dans la vitrine, entre son en-tête et son pied, en page
 * claire : elle alterne elle-même fonds clairs et sombres. Les sections se
 * suivent du sombre au clair : le hero, les chiffres, le programme, les
 * raisons de venir, les défis, l'ambiance, l'application, le pass, l'action
 * solidaire, les partenaires, les questions et le dernier appel. Chaque
 * section est une « scène » : ses éléments apparaissent quand elle entre à
 * l'écran (voir traversee.css).
 *
 * Les boutons « Réserver » mènent à la fiche de l'événement sur la
 * plateforme — inscription, billets, paiement —, retrouvée à son titre dès
 * que la chambre l'a créée dans le back-office. Son tarif public est celui
 * qu'affiche la page.
 */
export default async function LaTraverseePage() {
  // Lue à chaque visite, jamais à la compilation : la base n'est pas
  // joignable pendant le build, et la fiche peut être créée à tout moment.
  await connection();
  const evenement = await getProchainEvenementIntitule(EVENEMENT.nom);
  const billetterie = lienBilletterie(evenement?.id ?? null);
  // Un tarif à zéro sur la fiche n'est pas un tarif : on garde celui annoncé.
  const prixPass =
    evenement && evenement.prixPublic > 0
      ? evenement.prixPublic
      : EVENEMENT.prixPass;

  return (
    // Les variables de polices vont sur l'élément qui porte les jetons de la
    // page : `--titre` et `--texte-police` (traversee.css) les composent, et
    // une propriété personnalisée se résout là où elle est déclarée.
    <main
      className={`vitrine-claire la-traversee w-full flex-1 ${montserrat.variable} ${openSans.variable}`}
    >
      {/* La ligne de traversée : fixée au bord gauche, elle se dessine au
          fil du défilement, du rouge au vert. Invisible sur téléphone. */}
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
