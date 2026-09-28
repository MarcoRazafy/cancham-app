import { RessourcesPage } from "@/components/pages/RessourcesPage";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; dossier?: string }>;
}) {
  const { type, dossier } = await searchParams;
  return <RessourcesPage space="membre" type={type} dossier={dossier} />;
}
