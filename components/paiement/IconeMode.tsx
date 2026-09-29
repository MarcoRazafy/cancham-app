import Image from "next/image";
import {
  ArrowRightLeft,
  CreditCard,
  Globe,
  HandCoins,
  Landmark,
  Smartphone,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ModeReglement } from "@/lib/modes-reglement";

/**
 * Ce qu'on montre d'un moyen de règlement : son logo quand la chambre l'a,
 * une icône de la charte sinon.
 *
 * Les marques des opérateurs valent mieux qu'un pictogramme : un membre
 * reconnaît MVola ou Orange Money d'un coup d'œil, et se trompe moins de
 * tuile. Les fichiers sont ceux fournis par la chambre — remise en main
 * propre, virement international et plateformes n'en ont pas encore, et
 * gardent leur icône.
 */
const LOGOS: Partial<
  Record<ModeReglement, { src: string; largeur: number; hauteur: number }>
> = {
  mvola: { src: "/paiement/mvola.png", largeur: 811, hauteur: 378 },
  orange_money: {
    src: "/paiement/orange-money.png",
    largeur: 738,
    hauteur: 366,
  },
  airtel_money: {
    src: "/paiement/airtel-money.png",
    largeur: 520,
    hauteur: 229,
  },
  virement: { src: "/paiement/virement.jpg", largeur: 246, hauteur: 209 },
  depot: { src: "/paiement/depot.png", largeur: 225, hauteur: 225 },
  carte: { src: "/paiement/carte.jpeg", largeur: 738, hauteur: 363 },
};

const ICONES: Record<ModeReglement, LucideIcon> = {
  mvola: Smartphone,
  orange_money: Smartphone,
  airtel_money: Smartphone,
  virement: ArrowRightLeft,
  depot: Landmark,
  especes: HandCoins,
  carte: CreditCard,
  international: Globe,
  plateforme: Wallet,
};

/** L'icône seule, pour une ligne de texte. */
export function IconeMode({
  mode,
  size = 16,
  className = "text-accent",
}: {
  mode: ModeReglement;
  size?: number;
  className?: string;
}) {
  const Icone = ICONES[mode];
  return <Icone size={size} className={`shrink-0 ${className}`} aria-hidden />;
}

/**
 * Le visuel d'une tuile : logo ou icône, dans une bande de hauteur fixe pour
 * que les tuiles s'alignent quelles que soient les proportions des fichiers.
 */
export function VisuelMode({ mode }: { mode: ModeReglement }) {
  const logo = LOGOS[mode];
  return (
    <span className="flex h-12 items-center justify-center">
      {logo ? (
        <Image
          src={logo.src}
          alt=""
          width={logo.largeur}
          height={logo.hauteur}
          className="h-12 w-auto max-w-[140px] object-contain"
        />
      ) : (
        <IconeMode mode={mode} size={28} />
      )}
    </span>
  );
}
