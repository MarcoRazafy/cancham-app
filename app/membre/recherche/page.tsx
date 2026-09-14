import { RecherchePage } from "@/components/pages/RecherchePage";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  return <RecherchePage space="membre" q={q} />;
}
