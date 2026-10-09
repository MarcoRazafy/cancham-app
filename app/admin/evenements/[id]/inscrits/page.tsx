import { redirect } from "next/navigation";

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
