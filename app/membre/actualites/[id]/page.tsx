import { ArticlePage } from "@/components/pages/ArticlePage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArticlePage space="membre" id={id} />;
}
