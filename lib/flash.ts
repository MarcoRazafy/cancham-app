import { redirect } from "next/navigation";

function rediriger(path: string, message: string, erreur: boolean): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(
    `${path}${sep}msg=${encodeURIComponent(message)}${erreur ? "&ton=erreur" : ""}`,
  );
}

export function redirectWithFlash(path: string, message: string): never {
  rediriger(path, message, false);
}

export function redirectWithErreur(path: string, message: string): never {
  rediriger(path, message, true);
}
