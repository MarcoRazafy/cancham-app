import { TunnelAirtelMoney } from "@/components/paiement/portefeuilles/AirtelMoney";
import type { PropsTunnel } from "@/components/paiement/portefeuilles/commun";
import { TunnelMvola } from "@/components/paiement/portefeuilles/Mvola";
import { TunnelOrangeMoney } from "@/components/paiement/portefeuilles/OrangeMoney";

/**
 * Le règlement par portefeuille mobile : un écran par opérateur.
 *
 * MVola garde le panneau jaune de la maquette, Orange Money prend son
 * bandeau noir et ses chevrons, Airtel Money ses cartes arrondies. Le
 * parcours est le même partout — le numéro, l'envoi, le reçu — et vit dans
 * `portefeuilles/commun.tsx` ; seule la forme change.
 *
 * La plateforme n'encaisse rien ici : l'argent part du téléphone du membre
 * vers le numéro de la chambre. Tant que Vanilla Pay n'est pas branché,
 * c'est l'équipe qui constate l'arrivée — l'écran le dit sans détour.
 */
export function TunnelPortefeuille(p: PropsTunnel) {
  switch (p.mode) {
    case "mvola":
      return <TunnelMvola {...p} />;
    case "orange_money":
      return <TunnelOrangeMoney {...p} />;
    case "airtel_money":
      return <TunnelAirtelMoney {...p} />;
  }
}
