"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarCheck, CreditCard } from "lucide-react";
import { SubmitButton } from "@/components/form-bits";
import { FenetreMoyens } from "@/components/paiement/FenetreMoyens";
import type { ModeReglement } from "@/lib/modes-reglement";
import { reserverService } from "@/lib/actions/messages";
import { estLienInterne } from "@/lib/liens";

export function BoutonReservation({
  serviceId,
  payant,
  lien,
  achat,
}: {
  serviceId: string;
  payant: boolean;
  lien?: string | null;
  achat?: { titre: string; somme: string; modes: ModeReglement[] };
}) {
  if (lien) return <BoutonLien lien={lien} />;
  if (payant && achat?.modes.length) {
    return (
      <FenetreMoyens
        achat={{
          type: "service",
          id: serviceId,
          titre: achat.titre,
          somme: achat.somme,
        }}
        modes={achat.modes}
        declencheur={
          <>
            <CreditCard size={15} /> Payer
          </>
        }
        classeDeclencheur="btn-action btn-action-sm w-full"
      />
    );
  }
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

function BoutonLien({ lien }: { lien: string }) {
  const classe = "btn-action btn-action-sm w-full no-underline";
  if (!estLienInterne(lien)) {
    return (
      <a
        href={lien}
        target="_blank"
        rel="noopener noreferrer"
        className={classe}
      >
        <ArrowUpRight size={15} /> Ouvrir le lien
      </a>
    );
  }
  const rendezvous = lien.startsWith("/membre/rendez-vous");
  return (
    <Link href={lien} className={classe}>
      {rendezvous ? (
        <>
          <CalendarCheck size={15} /> Prendre rendez-vous
        </>
      ) : (
        <>
          <ArrowUpRight size={15} /> Ouvrir
        </>
      )}
    </Link>
  );
}
