"use client";

import { IncidentErreur } from "@/components/IncidentErreur";

export default function Erreur(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <IncidentErreur {...props} accueil="/" pleinEcran />;
}
