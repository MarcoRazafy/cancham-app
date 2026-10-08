import { RessourcesPage } from "@/components/pages/RessourcesPage";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    dossier?: string;
    q?: string;
    tri?: string;
    vue?: string;
  }>;
}) {
  const { type, dossier, q, tri, vue } = await searchParams;
  return (
    <RessourcesPage
      space="membre"
      type={type}
      dossier={dossier}
      q={q}
      tri={tri}
      vue={vue}
    />
  );
}
