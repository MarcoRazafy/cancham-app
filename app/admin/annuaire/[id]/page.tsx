import { FicheAnnuairePage } from "@/components/pages/FicheAnnuairePage";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <FicheAnnuairePage espace="admin" params={params} />;
}
