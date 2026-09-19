import { redirect } from "next/navigation";

/** Ancienne adresse de la liste des inscrits, fondue dans la page de l'événement. */
export default async function AncienneListe({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ onglet?: string }>;
}) {
  const [{ id }, { onglet }] = await Promise.all([params, searchParams]);
  redirect(
    `/admin/evenements/${id}?vue=inscrits${onglet === "presents" ? "&onglet=presents" : ""}`,
  );
}
