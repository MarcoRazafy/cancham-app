import {
  AgendaPage,
  type ParametresAgenda,
} from "@/components/pages/AgendaPage";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<ParametresAgenda>;
}) {
  return <AgendaPage espace="admin" searchParams={searchParams} />;
}
