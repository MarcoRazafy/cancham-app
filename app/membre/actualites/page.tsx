import { ActualitesPage } from "@/components/pages/ActualitesPage";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ voir?: string }>;
}) {
  const { voir } = await searchParams;
  return <ActualitesPage space="membre" voir={voir} />;
}
