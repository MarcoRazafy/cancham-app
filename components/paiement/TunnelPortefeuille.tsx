import { TunnelAirtelMoney } from "@/components/paiement/portefeuilles/AirtelMoney";
import type { PropsTunnel } from "@/components/paiement/portefeuilles/commun";
import { TunnelMvola } from "@/components/paiement/portefeuilles/Mvola";
import { TunnelOrangeMoney } from "@/components/paiement/portefeuilles/OrangeMoney";

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
