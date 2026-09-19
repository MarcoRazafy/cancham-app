"use client";

import { CalendarCheck, CreditCard } from "lucide-react";
import { SubmitButton } from "@/components/form-bits";
import { reserverService } from "@/lib/actions/messages";

/**
 * « Réserver » pour un service gratuit, « Payer » pour un service payant :
 * un clic, et la demande part à l'équipe, toute rédigée, dans la messagerie.
 * Le bouton se désactive pendant l'envoi — un double clic n'enverra pas deux
 * demandes.
 */
export function BoutonReservation({
  serviceId,
  payant,
}: {
  serviceId: string;
  payant: boolean;
}) {
  return (
    <form action={reserverService} className="w-full">
      <input type="hidden" name="serviceId" value={serviceId} />
      <SubmitButton sm pendingLabel="Envoi…" className="w-full">
        {payant ? (
          <>
            <CreditCard size={15} /> Payer
          </>
        ) : (
          <>
            <CalendarCheck size={15} /> Réserver
          </>
        )}
      </SubmitButton>
    </form>
  );
}
