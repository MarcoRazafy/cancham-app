import { redirect } from "next/navigation";

export default async function ChoisirMoyen({
  searchParams,
}: {
  searchParams: Promise<{ facture?: string }>;
}) {
  const { facture = "" } = await searchParams;
  redirect(
    facture
      ? `/membre/cotisations?regler=${encodeURIComponent(facture)}`
      : "/membre/cotisations",
  );
}
