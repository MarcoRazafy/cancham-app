import { ViewTransition, type ReactNode } from "react";

export function Partage({
  nom,
  children,
}: {
  nom: string;
  children: ReactNode;
}) {
  return (
    <ViewTransition name={nom} share="partage" default="none">
      {children}
    </ViewTransition>
  );
}
