"use client";

import { CalendarCheck } from "lucide-react";
import { SubmitButton } from "@/components/form-bits";
import { reserverService } from "@/lib/actions/messages";

/**
 * « Réserver et payer » : un clic, et la demande part à l'équipe, toute
 * rédigée, dans la messagerie. Le bouton se désactive pendant l'envoi — un
 * double clic n'enverra pas deux demandes.
 */
export function BoutonReservation({ serviceId }: { serviceId: string }) {
  return (
    <form action={reserverService} className="w-full">
      <input type="hidden" name="serviceId" value={serviceId} />
      <SubmitButton sm pendingLabel="Envoi…" className="w-full">
        <CalendarCheck size={15} /> Réserver et payer
      </SubmitButton>
    </form>
  );
}
