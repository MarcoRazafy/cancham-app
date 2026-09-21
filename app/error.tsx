"use client";

import { IncidentErreur } from "@/components/IncidentErreur";

/** Incident hors des espaces : pages publiques, inscription, bienvenue. */
export default function Erreur(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <IncidentErreur {...props} accueil="/" pleinEcran />;
}
