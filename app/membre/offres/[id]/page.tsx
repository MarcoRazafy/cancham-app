import { OffrePage } from "@/components/pages/OffrePage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OffrePage space="membre" id={id} />;
}
