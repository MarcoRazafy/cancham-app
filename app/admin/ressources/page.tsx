import { RessourcesPage } from "@/components/pages/RessourcesPage";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  return <RessourcesPage space="admin" type={type} />;
}
