"use client";

import { IncidentErreur } from "@/components/IncidentErreur";

/** Une page de l'espace a planté : le menu reste là, le reste s'excuse. */
export default function Erreur(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <IncidentErreur {...props} accueil="/admin" />;
}
