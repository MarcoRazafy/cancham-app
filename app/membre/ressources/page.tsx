import { RessourcesPage } from "@/components/pages/RessourcesPage";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; dossier?: string; q?: string }>;
}) {
  const { type, dossier, q } = await searchParams;
  return <RessourcesPage space="membre" type={type} dossier={dossier} q={q} />;
}
