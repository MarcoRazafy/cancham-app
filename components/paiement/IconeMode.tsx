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
 * Le pictogramme d'un moyen de règlement.
 *
 * Des icônes de la charte, et non les logos des opérateurs : MVola, Orange
 * Money, Airtel, Visa et Mastercard sont des marques déposées, dont l'usage
 * demande leurs fichiers officiels. Le jour où la chambre les a, ce fichier
 * est le seul à changer.
 */
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
