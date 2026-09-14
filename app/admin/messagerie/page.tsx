import { MessageriePage } from "@/components/pages/MessageriePage";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  return <MessageriePage space="admin" threadId={t} />;
}
