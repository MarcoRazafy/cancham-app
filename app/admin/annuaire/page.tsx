import {
  AnnuairePage,
  type ParametresAnnuaire,
} from "@/components/pages/AnnuairePage";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<ParametresAnnuaire>;
}) {
  return <AnnuairePage espace="admin" searchParams={searchParams} />;
}
